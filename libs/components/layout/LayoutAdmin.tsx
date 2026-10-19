import { useText } from '../../i18n';
import React, { ComponentType, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { AppBar, Avatar, Divider, Drawer, IconButton, Menu, MenuItem, Stack, Toolbar, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { userVar } from '../../../apollo/store';
import { logOut } from '../../auth';
import { imageUrl } from '../../feedback';
import SessionGate from '../common/SessionGate';
import LanguageMenu from '../common/LanguageMenu';
import AdminAttendanceNotifications from '../attendance/AdminAttendanceNotifications';
export default function withAdminLayout<P extends object>(Component: ComponentType<P>) {
	return function AdminLayout(props: P) {
		const { t } = useText();
		const user = useReactiveVar(userVar);
		const router = useRouter();
		const [account, setAccount] = useState<HTMLElement | null>(null);
		return (
			<SessionGate role="ADMIN">
				<main id="pc-wrap" className="admin quwat-shell">
					<Head>
						<title>{t('Quwat — Admin boshqaruvi')}</title>
					</Head>
					<AppBar
						position="fixed"
						className="quwat-admin-bar"
						sx={{ width: { xs: '100%', md: 'calc(100% - 280px)' }, ml: { md: '280px' } }}
					>
						<Toolbar sx={{ width: '100%', justifyContent: 'space-between', gap: 2 }}>
							<IconButton
								component={Link}
								href="/mypage"
								aria-label={t('Shaxsiy bo‘limga qaytish')}
								title={t('Shaxsiy bo‘limga qaytish')}
								sx={{
									flexShrink: 0,
									width: 40,
									height: 40,
									border: '1px solid #d4d4d8',
									borderRadius: 2,
									color: '#18181b',
									bgcolor: '#fff',
									'&:hover': { bgcolor: '#f4f4f5' },
								}}
							>
								<ArrowBackIcon />
							</IconButton>
							<Stack direction="row" alignItems="center" gap={2}>
								<AdminAttendanceNotifications onLightBackground />
								<LanguageMenu onLightBackground />
								<IconButton
									aria-label={t('Hisob menyusi')}
									onClick={(e) => setAccount(e.currentTarget)}
									sx={{ border: 0, boxShadow: 'none', p: 0.5 }}
								>
									<Avatar src={imageUrl(user.memberImage)} sx={{ border: 0, boxShadow: 'none' }} />
								</IconButton>
							</Stack>
						</Toolbar>
					</AppBar>
					<Menu anchorEl={account} open={Boolean(account)} onClose={() => setAccount(null)}>
						<MenuItem
							onClick={() => {
								setAccount(null);
								void router.push('/mypage');
							}}
						>
							{t('Profil')}
						</MenuItem>
						<MenuItem
							onClick={() => {
								setAccount(null);
								void logOut().then(() => router.push('/'));
							}}
						>
							{t('Chiqish')}
						</MenuItem>
					</Menu>
					<Drawer
						variant="permanent"
						anchor="left"
						className="aside quwat-admin-drawer"
						sx={{ width: 280, flexShrink: 0, '& .MuiDrawer-paper': { width: 280, boxSizing: 'border-box' } }}
					>
						<Toolbar className="quwat-admin-identity" sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
							<Stack className="logo-box">
								<Link passHref href="/" aria-label={t('Quwat bosh sahifa')}>
									<Image src="/img/logo/logoText.svg" width={44} height={44} alt="" />
									<span className="quwat-admin-brand-name">Quwat</span>
								</Link>
							</Stack>
							<Stack className="user" direction="row" alignItems="center" sx={{ borderRadius: 2, px: 3, py: 1.5 }}>
								<Avatar src={imageUrl(user.memberImage)} />
								<Typography variant="body2" sx={{ pl: 2 }}>
									{user.memberNick}
									<br />
									{user.memberPhone}
								</Typography>
							</Stack>
						</Toolbar>
						<Divider />
						<nav className="menu-list" aria-label={t('Admin menyusi')}>
							<Typography className="quwat-admin-nav-label" component="p">
								{t('Admin menyusi')}
							</Typography>
							<ul>
								{[
									{ href: '/_admin/products', label: t('Mahsulotlar'), Icon: Inventory2OutlinedIcon },
									{ href: '/_admin/users', label: t('Foydalanuvchilar'), Icon: PeopleOutlineRoundedIcon },
									{ href: '/_admin/attendance', label: t('Davomat'), Icon: CalendarMonthOutlinedIcon },
									{ href: '/_admin/sales', label: t('Savdolar'), Icon: ReceiptLongOutlinedIcon },
								].map(({ href, label, Icon }) => (
									<li key={href} className={router.pathname === href ? 'on' : ''}>
										<Link passHref href={href} aria-current={router.pathname === href ? 'page' : undefined}>
											<Icon className="quwat-admin-nav-icon" aria-hidden="true" />
											<span>{label}</span>
											<ChevronRightRoundedIcon className="quwat-admin-nav-arrow" aria-hidden="true" />
										</Link>
									</li>
								))}
							</ul>
						</nav>
					</Drawer>
					<div id="bunker">
						<Component {...props} />
					</div>
				</main>
			</SessionGate>
		);
	};
}
