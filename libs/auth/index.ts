import decodeJWT from 'jwt-decode';
import { initializeApollo } from '../../apollo/client';
import { emptyUser, sessionVar, userVar } from '../../apollo/store';
import { LOGIN, SIGN_UP, REFRESH_SESSION } from '../../apollo/user/mutation';
import { CHECK_AUTH, GET_MEMBER } from '../../apollo/user/query';
import { Member } from '../types/member/member';
import { expireSession, isAuthError } from './session';
export function getJwtToken(): string {
	return typeof window === 'undefined' ? '' : localStorage.getItem('accessToken') || '';
}
export function setJwtToken(token: string) {
	localStorage.setItem('accessToken', token);
}
export function applyMember(member: Member) {
	if (!member || member.memberStatus !== 'ACTIVE') {
		expireSession();
		return;
	}
	const { accessToken: _accessToken, ...profile } = member;
	userVar({
		...emptyUser,
		...profile,
		memberAuthType: member.memberAuthType,
		memberImage: member.memberImage || '',
		memberAddress: member.memberAddress || '',
		memberDesc: member.memberDesc || '',
	});
	sessionVar({ status: 'authenticated', error: '' });
}
export async function logIn(nick: string, password: string): Promise<void> {
	const client = initializeApollo();
	const { data } = await client.mutate<{ login: Member }>({
		mutation: LOGIN,
		variables: { input: { memberNick: nick, memberPassword: password } },
	});
	if (!data?.login.accessToken) throw new Error('Kirish amalga oshmadi.');
	await client.clearStore();
	setJwtToken(data.login.accessToken);
	applyMember(data.login);
}
export async function signUp(nick: string, password: string, phone: string): Promise<void> {
	const client = initializeApollo();
	const { data } = await client.mutate<{ signup: Member }>({
		mutation: SIGN_UP,
		variables: { input: { memberNick: nick, memberPassword: password, memberPhone: phone } },
	});
	if (!data?.signup.accessToken) throw new Error('Ro‘yxatdan o‘tish amalga oshmadi.');
	await client.clearStore();
	setJwtToken(data.signup.accessToken);
	applyMember(data.signup);
}
let restoring: { token: string; renew: boolean; promise: Promise<void> } | undefined;
export function restoreSession({ renew = true }: { renew?: boolean } = {}): Promise<void> {
	const token = getJwtToken();
	if (restoring?.token === token) {
		if (renew && !restoring.renew)
			return restoring.promise.then(() => (getJwtToken() === token ? restoreSession() : undefined));
		return restoring.promise;
	}
	const current = { token, renew, promise: Promise.resolve() };
	current.promise = (async () => {
		if (!token) {
			expireSession();
			return;
		}
		if (sessionVar().status !== 'authenticated') sessionVar({ status: 'loading', error: '' });
		let claims: { _id: string; exp?: number };
		try {
			claims = decodeJWT(token);
			if (!/^[a-f\d]{24}$/i.test(claims._id) || !claims.exp || claims.exp * 1000 <= Date.now()) {
				expireSession();
				return;
			}
		} catch {
			expireSession();
			return;
		}
		try {
			const client = initializeApollo();
			// A token rotation in another tab must not clear this account's cart/query cache.
			// A different identity must not reuse the previous account's cached data.
			if (userVar()._id && userVar()._id !== claims._id) {
				userVar({ ...emptyUser });
				sessionVar({ status: 'loading', error: '' });
				await client.clearStore();
				if (getJwtToken() !== token) return;
			}
			let member: Member | undefined;
			if (renew) {
				const { data } = await client.mutate<{ refreshSession: Member }>({
					mutation: REFRESH_SESSION,
					fetchPolicy: 'no-cache',
				});
				member = data?.refreshSession;
			} else {
				await client.query({ query: CHECK_AUTH, fetchPolicy: 'network-only' });
				if (getJwtToken() !== token) return;
				const { data } = await client.query<{ getMember: Member }>({
					query: GET_MEMBER,
					variables: { input: claims._id },
					fetchPolicy: 'network-only',
				});
				member = data?.getMember;
			}
			if (getJwtToken() !== token) return;
			if (!member || member._id !== claims._id || member.memberStatus !== 'ACTIVE') {
				expireSession();
				await client.clearStore();
				return;
			}
			if (renew) {
				const renewed = member.accessToken;
				const renewedClaims = renewed ? decodeJWT<{ _id: string; exp?: number }>(renewed) : undefined;
				if (
					!renewed ||
					renewedClaims?._id !== claims._id ||
					!renewedClaims.exp ||
					renewedClaims.exp * 1000 <= Date.now()
				)
					throw new Error('Invalid renewed session');
				setJwtToken(renewed);
			}
			applyMember(member);
		} catch (error) {
			if (getJwtToken() !== token) return;
			if (isAuthError(error)) expireSession();
			else sessionVar({ status: 'error', error: 'Serverga ulanib bo‘lmadi. Qayta urinib ko‘ring.' });
		}
	})().finally(() => {
		if (restoring === current) restoring = undefined;
	});
	restoring = current;
	return current.promise;
}
export async function logOut() {
	expireSession();
	await initializeApollo().clearStore();
}
