import { useText } from '../../i18n';
import React, { ComponentType, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { AppBar, Avatar, Divider, Drawer, IconButton, Menu, MenuItem, Stack, Toolbar, Typography } from '@mui/material';
import { userVar } from '../../../apollo/store';
import { logOut } from '../../auth';
import { imageUrl } from '../../feedback';
import SessionGate from '../common/SessionGate';
import LanguageMenu from '../common/LanguageMenu';
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
						<Toolbar sx={{ justifyContent: 'space-between' }}>
							<LanguageMenu onLightBackground />
							<IconButton aria-label={t('Hisob menyusi')} onClick={(e) => setAccount(e.currentTarget)}>
								<Avatar src={imageUrl(user.memberImage)} />
							</IconButton>
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
						<Toolbar sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
							<Stack className="logo-box">
								<Link passHref href="/" aria-label={t('Quwat bosh sahifa')}>
									<Image src="/img/logo/logoText.svg" width={90} height={90} alt="Quwat" />
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
							<ul>
								{[
									['/_admin/products', t('Mahsulotlar')],
									['/_admin/users', t('Foydalanuvchilar')],
									['/_admin/attendance', t('Davomat')],
									['/_admin/sales', t('Savdolar')],
								].map(([href, label]) => (
									<li key={href} className={router.pathname === href ? 'on' : ''}>
										<Link href={href} aria-current={router.pathname === href ? 'page' : undefined}>
											{t(label)}
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
