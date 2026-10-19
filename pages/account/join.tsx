import { useText } from '../../libs/i18n';
import Image from 'next/image';
import { IconButton } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import React, { FormEvent, useState } from 'react';
import { Alert, Button, Stack } from '@mui/material';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useRouter } from 'next/router';
import { serverSideTranslations } from '../../libs/serverTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { logIn, signUp } from '../../libs/auth';
import { errorText } from '../../libs/feedback';
export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
function Join() {
	const { t, errorMessage: translateError } = useText();
	const router = useRouter();
	const [signup, setSignup] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [input, setInput] = useState({ nick: '', password: '', phone: '' });
	async function submit(event: FormEvent) {
		event.preventDefault();
		setBusy(true);
		setError('');
		try {
			if (signup) await signUp(input.nick, input.password, input.phone);
			else await logIn(input.nick, input.password);
			await router.push('/');
		} catch (error) {
			setError(errorText(error));
		} finally {
			setBusy(false);
		}
	}
	return (
		<Stack className="join-page quwat-auth-page">
			<Stack className="container">
				<Stack className="main">
					<Stack className="left">
						<div className="logo">
							<Image src="/img/logo/logoText.svg" alt="" width={40} height={40} />
							<span>Quwat</span>
						</div>
						<div className="info">
							<h1>{signup ? t('Ro‘yxatdan o‘tish') : t('Tizimga kirish')}</h1>
							<p>{t('Quwat hisobingiz orqali davom eting.')}</p>
						</div>
						<form onSubmit={submit}>
							{error && <Alert severity="error">{translateError(error)}</Alert>}
							<div className="input-wrap">
								<div className="input-box">
									<label htmlFor="nickname">{t('Foydalanuvchi nomi')}</label>
									<div className="auth-field">
										<PersonOutlineRoundedIcon aria-hidden="true" />
										<input
											id="nickname"
											autoComplete="username"
											required
											minLength={3}
											maxLength={12}
											value={input.nick}
											onChange={(e) => setInput({ ...input, nick: e.target.value })}
										/>
									</div>
								</div>
								<div className="input-box">
									<label htmlFor="password">{t('Parol')}</label>
									<div className="auth-field">
										<LockOutlinedIcon aria-hidden="true" />
										<input
											id="password"
											type={showPassword ? 'text' : 'password'}
											autoComplete={signup ? 'new-password' : 'current-password'}
											required
											minLength={5}
											maxLength={12}
											value={input.password}
											onChange={(e) => setInput({ ...input, password: e.target.value })}
										/>
										<IconButton
											className="quwat-desktop-only quwat-password-toggle"
											type="button"
											aria-label={t(showPassword ? 'Parolni yashirish' : 'Parolni ko‘rsatish')}
											aria-pressed={showPassword}
											onClick={() => setShowPassword(!showPassword)}
										>
											{showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
										</IconButton>
									</div>
								</div>
								{signup && (
									<div className="input-box">
										<label htmlFor="phone">{t('Telefon')}</label>
										<div className="auth-field">
											<PhoneOutlinedIcon aria-hidden="true" />
											<input
												id="phone"
												type="tel"
												required
												autoComplete="tel"
												value={input.phone}
												onChange={(e) => setInput({ ...input, phone: e.target.value })}
											/>
										</div>
									</div>
								)}
							</div>
							<div className="register">
								<Button variant="contained" type="submit" disabled={busy} endIcon={<ArrowForwardRoundedIcon />}>
									{busy ? t('Kutilmoqda…') : signup ? t('Ro‘yxatdan o‘tish') : t('Kirish')}
								</Button>
							</div>
						</form>
						<div className="ask-info">
							<p>
								{signup ? t('Hisobingiz bormi?') : t('Yangi foydalanuvchimisiz?')}
								<Button
									onClick={() => {
										setSignup(!signup);
										setShowPassword(false);
										setError('');
									}}
								>
									{signup ? t('Kirish') : t('Ro‘yxatdan o‘tish')}
								</Button>
							</p>
						</div>
					</Stack>
					<Stack className="right">
						<div className="auth-photo-copy">
							<span className="auth-photo-brand">Quwat</span>
							<p>{t('Qurilish materiallari do‘koni')}</p>
						</div>
					</Stack>
				</Stack>
			</Stack>
		</Stack>
	);
}
export default withLayoutBasic(Join);
