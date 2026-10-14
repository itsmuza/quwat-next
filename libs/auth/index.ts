import decodeJWT from 'jwt-decode';
import { initializeApollo } from '../../apollo/client';
import { emptyUser, sessionVar, userVar } from '../../apollo/store';
import { LOGIN, SIGN_UP } from '../../apollo/user/mutation';
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
let restoring: Promise<void> | undefined;
export function restoreSession(): Promise<void> {
	if (restoring) return restoring;
	restoring = (async () => {
		const token = getJwtToken();
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
			await client.query({ query: CHECK_AUTH, fetchPolicy: 'network-only' });
			const { data } = await client.query<{ getMember: Member }>({
				query: GET_MEMBER,
				variables: { input: claims._id },
				fetchPolicy: 'network-only',
			});
			if (getJwtToken() !== token) return;
			if (data.getMember._id !== claims._id || data.getMember.memberStatus !== 'ACTIVE') {
				expireSession();
				await client.clearStore();
				return;
			}
			applyMember(data.getMember);
		} catch (error) {
			if (getJwtToken() !== token) return;
			if (isAuthError(error)) expireSession();
			else sessionVar({ status: 'error', error: 'Serverga ulanib bo‘lmadi. Qayta urinib ko‘ring.' });
		}
	})().finally(() => {
		restoring = undefined;
	});
	return restoring;
}
export async function logOut() {
	expireSession();
	await initializeApollo().clearStore();
}
