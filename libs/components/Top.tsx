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
import { AnimatePresence, motion, MotionConfig, useAnimationControls, useReducedMotion } from 'framer-motion';

const MotionStack = motion.create(Stack);
const MotionLink = motion.create(Link);

export default function Top() {
	const { t } = useText();
	const user = useReactiveVar(userVar);
	const session = useReactiveVar(sessionVar);
	const router = useRouter();
	const reducedMotion = useReducedMotion();
	const entrance = useAnimationControls();
	const [scrolled, setScrolled] = useState(false);
	const [account, setAccount] = useState<HTMLElement | null>(null);
	useEffect(() => {
		if (!reducedMotion) {
			void entrance.start({ opacity: [0.9, 1], y: [-8, 0], transition: { duration: 0.4, ease: 'easeOut' } });
		} else {
			entrance.set({ opacity: 1, y: 0 });
		}
		return () => entrance.stop();
	}, [reducedMotion, entrance]);
	useEffect(() => {
		const update = () => setScrolled(window.scrollY >= 50);
		update();
		window.addEventListener('scroll', update, { passive: true });
		return () => window.removeEventListener('scroll', update);
	}, []);
	const solid = scrolled || router.pathname === '/product/detail' || router.pathname.startsWith('/_admin');
	const links = [
		{ href: '/', label: 'Bosh sahifa' },
		{ href: '/product', label: 'Katalog' },
		{ href: '/agent', label: 'Agentlar' },
		{ href: '/about', label: 'Biz haqimizda' },
		...(session.status === 'authenticated' ? [{ href: '/mypage', label: 'Shaxsiy bo‘lim' }] : []),
		{ href: '/cs', label: 'Yordam' },
	];
	return (
		<MotionConfig reducedMotion="user">
			<Stack className="navbar">
				<Stack className={`navbar-main quwat-glass-navbar ${solid ? 'transparent' : ''}`}>
					<MotionStack
						className="container"
						initial={false}
						animate={entrance}
					>
						<div className="logo-box">
							<Link passHref href="/" className="quwat-original-brand">
								<Image src="/img/logo/logoText.svg" width={40} height={40} alt="" />
								<strong>Quwat</strong>
							</Link>
						</div>
						<div className="router-box">
							{links.map(({ href, label }) => (
								<MotionLink
									key={href}
									href={href}
									aria-current={
										router.pathname === href || (href !== '/' && router.pathname.startsWith(`${href}/`))
											? 'page'
											: undefined
									}
									whileHover={!reducedMotion ? { y: -2 } : undefined}
									whileTap={!reducedMotion ? { scale: 0.97 } : undefined}
									transition={{ type: 'spring', stiffness: 400, damping: 28 }}
								>
									{t(label)}
								</MotionLink>
							))}
						</div>
						<div className="user-box">
							<CartMenu />
							<AnimatePresence initial={false} mode="wait">
								<motion.div
									key={session.status === 'authenticated' ? 'account' : 'join'}
									className="quwat-navbar-account"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									transition={{ duration: reducedMotion ? 0 : 0.16 }}
								>
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
								</motion.div>
							</AnimatePresence>
							<div className="lan-box">
								<LanguageMenu />
							</div>
						</div>
					</MotionStack>
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
		</MotionConfig>
	);
}
