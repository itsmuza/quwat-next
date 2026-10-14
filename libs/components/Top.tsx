import { useText } from '../i18n';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { Button, Menu, MenuItem, Stack, Avatar } from '@mui/material';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LanguageMenu from './common/LanguageMenu';
import { sessionVar, userVar } from '../../apollo/store';
import { logOut } from '../auth';
import { imageUrl } from '../feedback';
import CartMenu from './cart/CartMenu';
export default function Top() {
	const { t } = useText();
	const user = useReactiveVar(userVar);
	const session = useReactiveVar(sessionVar);
	const router = useRouter();
	const [scrolled, setScrolled] = useState(false);
	const [account, setAccount] = useState<HTMLElement | null>(null);
	useEffect(() => {
		const update = () => setScrolled(window.scrollY >= 50);
		update();
		window.addEventListener('scroll', update, { passive: true });
		return () => window.removeEventListener('scroll', update);
	}, []);
	const solid = scrolled || router.pathname === '/product/detail' || router.pathname.startsWith('/_admin');
	return (
		<Stack className="navbar">
			<Stack className={`navbar-main ${solid ? 'transparent' : ''}`}>
				<Stack className="container">
					<div className="logo-box">
						<Link passHref href="/" className="quwat-original-brand">
							<Image src="/img/logo/logoText.svg" width={40} height={40} alt="" />
							<strong>Quwat</strong>
						</Link>
					</div>
					<div className="router-box">
						<Link href="/">{t('Bosh sahifa')}</Link>
						<Link href="/product">{t('Katalog')}</Link>
						<Link href="/agent">{t('Agentlar')}</Link>
						<Link href="/about">{t('Biz haqimizda')}</Link>
						{session.status === 'authenticated' && <Link href="/mypage">{t('Shaxsiy bo‘lim')}</Link>}
						<Link href="/cs">{t('Yordam')}</Link>
					</div>
					<div className="user-box">
						<CartMenu />
						{session.status === 'authenticated' ? (
							<Button
								className="login-user"
								aria-label={t('Hisob menyusi')}
								onClick={(e) => setAccount(e.currentTarget)}
							>
								<Avatar src={imageUrl(user.memberImage)} />
							</Button>
						) : (
							<Link passHref href="/account/join">
								<div className="join-box">
									<AccountCircleOutlinedIcon />
									<span>{t('navbar.auth')}</span>
								</div>
							</Link>
						)}
						<div className="lan-box">
							<LanguageMenu />
						</div>
					</div>
				</Stack>
			</Stack>
			<Menu anchorEl={account} open={Boolean(account)} onClose={() => setAccount(null)}>
				<MenuItem
					onClick={() => {
						setAccount(null);
						void router.push('/mypage');
					}}
				>
					{t('Profil')}
				</MenuItem>
				{user.memberType === 'ADMIN' && (
					<MenuItem
						onClick={() => {
							setAccount(null);
							void router.push('/_admin/products');
						}}
					>
						{t('Admin')}
					</MenuItem>
				)}
				<MenuItem
					onClick={() => {
						setAccount(null);
						void logOut().then(() => router.push('/'));
					}}
				>
					{t('Chiqish')}
				</MenuItem>
			</Menu>
		</Stack>
	);
}
