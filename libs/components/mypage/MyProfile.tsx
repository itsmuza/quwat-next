import { useText } from '../../i18n';
import React, { FormEvent, useState } from 'react';
import Image from 'next/image';
import { useMutation, useReactiveVar } from '@apollo/client';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { userVar } from '../../../apollo/store';
import { UPDATE_MEMBER } from '../../../apollo/user/mutation';
import { Member } from '../../types/member/member';
import { MemberUpdate } from '../../types/member/member.update';
import { applyMember, setJwtToken } from '../../auth';
import { errorText, imageUrl } from '../../feedback';
import { uploadImages } from '../../upload';
export default function MyProfile() {
	const { t, errorMessage: translateError } = useText();
	const user = useReactiveVar(userVar);
	const [form, setForm] = useState({
		memberNick: user.memberNick,
		memberPhone: user.memberPhone,
		memberFullName: user.memberFullName || '',
		memberAddress: user.memberAddress || '',
		memberDesc: user.memberDesc || '',
		memberImage: user.memberImage || '',
		memberPassword: '',
	});
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);
	const [update] = useMutation<{ updateMember: Member }, { input: MemberUpdate }>(UPDATE_MEMBER);
	async function submit(event: FormEvent) {
		event.preventDefault();
		setError('');
		setSuccess(false);
		setBusy(true);
		try {
			const { data } = await update({
				variables: {
					input: {
						...form,
						memberFullName: form.memberFullName.trim() || undefined,
						memberPassword: form.memberPassword || undefined,
					},
				},
			});
			if (!data) throw new Error('Profil yangilanmadi.');
			if (data.updateMember.accessToken) setJwtToken(data.updateMember.accessToken);
			applyMember(data.updateMember);
			setForm({ ...form, memberPassword: '' });
			setSuccess(true);
		} catch (error) {
			setError(errorText(error));
		} finally {
			setBusy(false);
		}
	}
	async function upload(files: File[]) {
		setBusy(true);
		setError('');
		try {
			const [image] = await uploadImages(files, 'member');
			setForm({ ...form, memberImage: image });
		} catch (error) {
			setError(errorText(error));
		} finally {
			setBusy(false);
		}
	}
	return (
		<Stack component="form" id="my-profile-page" onSubmit={submit}>
			<Stack className="main-title-box">
				<Stack className="right-box">
					<Typography className="main-title">{t('Mening profilim')}</Typography>
					<Typography className="sub-title">{t('Shaxsiy ma’lumotlaringizni yangilang.')}</Typography>
				</Stack>
			</Stack>
			{error && <Alert severity="error">{translateError(error)}</Alert>}
			{success && <Alert severity="success">{t('Profil yangilandi.')}</Alert>}
			<Stack className="top-box">
				<Stack className="photo-box">
					<Typography className="title">{t('Profil rasmi')}</Typography>
					<Stack className="image-big-box">
						<Stack className="image-box">
							<Image
								unoptimized
								fill
								sizes="194px"
								className={!form.memberImage ? 'default-image' : undefined}
								src={imageUrl(form.memberImage) || '/img/profile/defaultUser.svg'}
								alt={t('Profil')}
							/>
						</Stack>
						<Stack className="upload-big-box">
							<Button className="labeler" component="label" disabled={busy}>
								{t('Rasm yuklash')}{' '}
								<input
									hidden
									type="file"
									accept="image/jpeg,image/png"
									onChange={(e) => {
										const files = Array.from(e.target.files || []);
										e.target.value = '';
										if (files.length) void upload(files);
									}}
								/>
							</Button>
							<Typography className="upload-text">{t('JPEG yoki PNG')}</Typography>
						</Stack>
					</Stack>
				</Stack>
				<Stack className="small-input-box">
					<Stack className="input-box">
						<label className="title" htmlFor="profile-nick">
							{t('Foydalanuvchi nomi')}
						</label>
						<input
							id="profile-nick"
							required
							minLength={3}
							maxLength={12}
							value={form.memberNick}
							onChange={(e) => setForm({ ...form, memberNick: e.target.value })}
						/>
					</Stack>
					<Stack className="input-box">
						<label className="title" htmlFor="profile-phone">
							{t('Telefon')}
						</label>
						<input
							id="profile-phone"
							type="tel"
							required
							value={form.memberPhone}
							onChange={(e) => setForm({ ...form, memberPhone: e.target.value })}
						/>
					</Stack>
					<Stack className="input-box">
						<label className="title" htmlFor="profile-name">
							{t('To‘liq ism')}
						</label>
						<input
							id="profile-name"
							minLength={3}
							maxLength={100}
							value={form.memberFullName}
							onChange={(e) => setForm({ ...form, memberFullName: e.target.value })}
						/>
					</Stack>
					<Stack className="input-box">
						<label className="title" htmlFor="profile-password">
							{t('Yangi parol (ixtiyoriy)')}
						</label>
						<input
							id="profile-password"
							type="password"
							autoComplete="new-password"
							minLength={5}
							maxLength={12}
							value={form.memberPassword}
							onChange={(e) => setForm({ ...form, memberPassword: e.target.value })}
						/>
					</Stack>
				</Stack>
				<Stack className="address-box">
					<label className="title" htmlFor="profile-address">
						{t('Manzil')}
					</label>
					<input
						id="profile-address"
						value={form.memberAddress}
						onChange={(e) => setForm({ ...form, memberAddress: e.target.value })}
					/>
				</Stack>
				<Stack className="about-me-box">
					<label className="title" htmlFor="profile-desc">
						{t('O‘zingiz haqingizda')}
					</label>
					<textarea
						id="profile-desc"
						className="about-textarea"
						value={form.memberDesc}
						onChange={(e) => setForm({ ...form, memberDesc: e.target.value })}
					/>
					<Button className="update-button" type="submit" variant="contained" disabled={busy}>
						{busy ? t('Kutilmoqda…') : t('Saqlash')}
					</Button>
				</Stack>
			</Stack>
		</Stack>
	);
}
