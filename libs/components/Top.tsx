import { useText } from '../i18n';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { Button, Menu, MenuItem, Stack, Avatar, Drawer, IconButton } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import HeaderFilter from './homepage/HeaderFilter';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LanguageMenu from './common/LanguageMenu';
import { sessionVar, userVar } from '../../apollo/store';
import { logOut } from '../auth';
import { imageUrl } from '../feedback';
import CartMenu from './cart/CartMenu';
import AgentNotifications from './sale/AgentNotifications';
import AdminAttendanceNotifications from './attendance/AdminAttendanceNotifications';
import { AnimatePresence, motion, MotionConfig, useAnimationControls, useReducedMotion } from 'framer-motion';

const MotionStack = motion.create(Stack);
const MotionLink = motion.create(Link);

export default function Top({ home = false, storefront = false }: { home?: boolean; storefront?: boolean }) {
	const store = home || storefront;
	const { t } = useText();
	const user = useReactiveVar(userVar);
	const session = useReactiveVar(sessionVar);
	const router = useRouter();
	const reducedMotion = useReducedMotion();
	const entrance = useAnimationControls();
	const [scrolled, setScrolled] = useState(false);
	const [account, setAccount] = useState<HTMLElement | null>(null);
	const [navigationOpen, setNavigationOpen] = useState(false);
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
		{ href: '/', label: 'Bosh sahifa', icon: HomeOutlinedIcon },
		{ href: '/product', label: 'Katalog', icon: GridViewOutlinedIcon },
		{ href: '/agent', label: 'Agentlar', icon: PeopleOutlineRoundedIcon },
		{ href: '/about', label: 'Biz haqimizda', icon: InfoOutlinedIcon },
		...(session.status === 'authenticated'
			? [{ href: '/mypage', label: 'Shaxsiy bo‘lim', icon: PersonOutlineRoundedIcon }]
			: []),
		{ href: '/cs', label: 'Yordam', icon: HelpOutlineRoundedIcon },
	];
	return (
		<MotionConfig reducedMotion="user">
			<Stack className={`navbar${store ? ' quwat-store-header' : ''}`}>
				{store && (
					<div className="quwat-home-utility">
						<div className="container">
							<span>{t('Qurilish materiallari do‘koni')}</span>
							<Link passHref href="/agent">
								{t('Agentlar')}
							</Link>
							<Link passHref href="/cs">
								{t('Yordam bo‘limi')}
							</Link>
						</div>
					</div>
				)}
				<Stack className={`navbar-main quwat-glass-navbar ${solid ? 'transparent' : ''}`}>
					<MotionStack className="container" initial={false} animate={entrance}>
						<div className="logo-box">
							{store && (
								<IconButton
									className="quwat-home-menu"
									aria-label={t('Menyuni ochish')}
									aria-haspopup="dialog"
									aria-expanded={navigationOpen}
									aria-controls={navigationOpen ? 'home-navigation-dialog' : undefined}
									onClick={() => setNavigationOpen(true)}
								>
									<MenuRoundedIcon />
								</IconButton>
							)}
							<Link passHref href="/" className="quwat-original-brand">
								<Image src="/img/logo/logoText.svg" width={40} height={40} alt="" />
								<strong>Quwat</strong>
							</Link>
						</div>
						{store && (
							<div className="quwat-home-header-search">
								<HeaderFilter compact />
							</div>
						)}
						<div className="router-box">
							{store && (
								<Link passHref href="/product" className="quwat-home-catalog-link">
									<GridViewRoundedIcon aria-hidden="true" />
									{t('Barcha mahsulotlar')}
								</Link>
							)}
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
							<AgentNotifications />
							<AdminAttendanceNotifications />
							<AnimatePresence initial={false} mode="popLayout">
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
										<Link
											passHref
											href="/account/join"
											className="quwat-sign-in-link"
											aria-label={t('Tizimga kirish')}
										>
											<div className="join-box">
												<AccountCircleOutlinedIcon aria-hidden="true" />
												<span className="quwat-sign-in-desktop-label">{t('navbar.auth')}</span>
												<span className="quwat-sign-in-mobile-label">{t('Kirish')}</span>
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
				{store && (
					<Drawer
						className="quwat-navigation-drawer"
						open={navigationOpen}
						onClose={() => setNavigationOpen(false)}
						transitionDuration={reducedMotion ? 0 : undefined}
						PaperProps={{
							className: 'quwat-navigation-panel',
							id: 'home-navigation-dialog',
							role: 'dialog',
							'aria-modal': true,
							'aria-label': t('Asosiy menyu'),
							sx: { width: 'min(320px, 90vw)', p: 3 },
						}}
					>
						<div className="quwat-navigation-header">
							<Link passHref href="/" className="quwat-navigation-brand" onClick={() => setNavigationOpen(false)}>
								<Image src="/img/logo/logoText.svg" width={32} height={32} alt="" />
								<strong>Quwat</strong>
							</Link>
							<IconButton aria-label={t('Menyuni yopish')} onClick={() => setNavigationOpen(false)}>
								<CloseRoundedIcon />
							</IconButton>
						</div>
						<div className="quwat-navigation-body">
							<h2>{t('Asosiy menyu')}</h2>
							<nav className="quwat-navigation-links" aria-label={t('Asosiy menyu')}>
								{links.map(({ href, label, icon: Icon }) => (
									<Link
										passHref
										key={href}
										className="quwat-navigation-link"
										href={href}
										aria-current={
											router.pathname === href || (href !== '/' && router.pathname.startsWith(`${href}/`))
												? 'page'
												: undefined
										}
										onClick={() => setNavigationOpen(false)}
									>
										<Icon aria-hidden="true" />
										<span>{t(label)}</span>
										<ChevronRightRoundedIcon className="quwat-navigation-chevron" aria-hidden="true" />
									</Link>
								))}
							</nav>
						</div>
						<div className="quwat-navigation-footer">
							<p>{t('Qurilish materiallari do‘koni')}</p>
							<span>{t('Kerakli mahsulotlar bir joyda')}</span>
						</div>
					</Drawer>
				)}
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
