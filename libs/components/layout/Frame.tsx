import { useText } from '../../i18n';
import React, { ReactNode } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Alert, Button, Stack } from '@mui/material';
import { useReactiveVar } from '@apollo/client';
import { sessionVar } from '../../../apollo/store';
import { restoreSession } from '../../auth';
import Top from '../Top';
import Footer from '../Footer';
import Chat from '../Chat';
import HeaderFilter from '../homepage/HeaderFilter';
import FiberContainer from '../common/FiberContainer';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
export default function Frame({ children, home }: { children: ReactNode; home?: boolean }) {
	const { t, errorMessage: translateError } = useText();
	const session = useReactiveVar(sessionVar);
	const router = useRouter();
	const titles: Record<string, string> = {
		'/product': t('Mahsulotlar'),
		'/agent': t('Agentlar'),
		'/agent/detail': t('Agent profili'),
		'/member': t('Foydalanuvchi profili'),
		'/mypage': t('Shaxsiy bo‘lim'),
		'/account/join': t('Kirish / Ro‘yxatdan o‘tish'),
		'/about': t('Biz haqimizda'),
		'/cs': t('Yordam'),
		'/404': t('Sahifa topilmadi'),
		'/500': t('Server xatosi'),
	};
	const basic = !home && !router.pathname.startsWith('/_admin') && router.pathname !== '/product/detail';
	const background =
		router.pathname === '/product'
			? '/img/banner/properties.png'
			: router.pathname === '/agent'
			? '/img/banner/agents.webp'
			: '/img/banner/header2.svg';
	return (
		<Stack id="pc-wrap" className="quwat-shell">
			<Head>
				<title>{t('Quwat — Qurilish materiallari')}</title>
				<meta
					name="description"
					content={t('Quwat mahsulotlar katalogi: asboblar, santexnika va qurilish buyumlari.')}
				/>
			</Head>
			<Stack id="top">
				<Top />
			</Stack>
			{session.status === 'error' && (
				<Alert severity="warning" action={<Button onClick={() => void restoreSession()}>{t('Qayta urinish')}</Button>}>
					{translateError(session.error)}
				</Alert>
			)}
			{home && (
				<Stack className="header-main">
					<FiberContainer />
					<Stack className="container">
						<HeaderFilter />
					</Stack>
				</Stack>
			)}
			{basic && (
				<Stack
					className={`header-basic ${router.pathname === '/account/join' ? 'auth' : ''}`}
					style={{
						backgroundImage: `url(${background})`,
						backgroundSize: 'cover',
						boxShadow: 'inset 10px 40px 150px 40px rgb(24 22 36)',
					}}
				>
					<Stack className="container">
						<strong>{titles[router.pathname] || 'Quwat'}</strong>
						<span>Quwat / {titles[router.pathname] || t('Katalog')}</span>
					</Stack>
				</Stack>
			)}
			<main id="main" className={!basic && !home ? 'quwat-no-banner' : undefined}>
				{children}
			</main>
			<Chat />
			<Stack id="footer">
				<Footer />
			</Stack>
		</Stack>
	);
}
