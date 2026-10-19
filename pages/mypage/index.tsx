import { useText } from '../../libs/i18n';
import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded';
import BookmarkBorderRounded from '@mui/icons-material/BookmarkBorderRounded';
import FavoriteBorderRounded from '@mui/icons-material/FavoriteBorderRounded';
import HistoryRounded from '@mui/icons-material/HistoryRounded';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import EventAvailableOutlined from '@mui/icons-material/EventAvailableOutlined';
import SupportAgentOutlined from '@mui/icons-material/SupportAgentOutlined';
import { imageUrl } from '../../libs/feedback';
import { Avatar, Button } from '@mui/material';
import { logOut } from '../../libs/auth';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import { serverSideTranslations } from '../../libs/serverTranslations';
import { userVar } from '../../apollo/store';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import SessionGate from '../../libs/components/common/SessionGate';
import MyProfile from '../../libs/components/mypage/MyProfile';
import ProductList from '../../libs/components/mypage/ProductList';
import MyAttendance from '../../libs/components/mypage/MyAttendance';
import SalesPanel from '../../libs/components/sale/SalesPanel';
export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
function Account() {
	const { t, locale } = useText();
	const user = useReactiveVar(userVar);
	const router = useRouter();
	const category = typeof router.query.category === 'string' ? router.query.category : 'myProfile';
	const allowed = useMemo(
		() => [
			'myProfile',
			...(user.memberType !== 'ADMIN' ? ['myFavorites', 'recentlyVisited'] : []),
			...(user.memberType === 'CLIENT' ? ['saved', 'orders'] : []),
			...(user.memberType === 'AGENT' ? ['attendance', 'payments'] : []),
		],
		[user.memberType],
	);
	const selectedCategory = allowed.includes(category) ? category : 'myProfile';
	useEffect(() => {
		if (router.isReady && !allowed.includes(category))
			void router.replace('/mypage', undefined, { shallow: true, scroll: false });
	}, [allowed, category, router]);
	const menu = [
		['myProfile', t('Profil')],
		['myFavorites', t('Yoqtirilganlar')],
		['recentlyVisited', t('Yaqinda ko‘rilganlar')],
		...(user.memberType === 'CLIENT'
			? [
					['saved', t('Saqlanganlar')],
					['orders', t('Xaridlarim')],
			  ]
			: []),
		...(user.memberType === 'AGENT'
			? [
					['attendance', t('Davomat')],
					['payments', t('To‘lov so‘rovlari')],
			  ]
			: []),
	].filter(([key]) => allowed.includes(key));
	return (
		<div id="my-page" className="quwat-page quwat-account">
			<div className="quwat-account-navigation">
				<div className="quwat-mobile-account-summary">
					<Avatar src={imageUrl(user.memberImage)} />
					<div>
						<h1>{user.memberFullName || user.memberNick}</h1>
						<p>@{user.memberNick}</p>
						<span>{t(user.memberType === 'CLIENT' ? 'Mijoz' : user.memberType === 'AGENT' ? 'Agent' : 'Admin')}</span>
					</div>
				</div>
				<aside
					className={`quwat-side${user.memberType === 'ADMIN' ? ' quwat-admin-personal-nav' : ''}`}
					aria-label={t('Shaxsiy bo‘limlar')}
				>
					<h2 className="quwat-desktop-only quwat-account-menu-title">{t('Shaxsiy bo‘limlar')}</h2>
					{menu.map(([key, label]) => (
						<Link
							key={key}
							href={{ pathname: '/mypage', query: { category: key } }}
							passHref
							shallow
							scroll={false}
							aria-current={selectedCategory === key ? 'page' : undefined}
						>
							{user.memberType === 'ADMIN' ? (
								<PersonOutlineRounded className="quwat-personal-nav-icon" />
							) : (
								<span className="quwat-desktop-only quwat-personal-nav-icon">
									{key === 'myProfile' ? (
										<PersonOutlineRounded />
									) : key === 'saved' ? (
										<BookmarkBorderRounded />
									) : key === 'myFavorites' ? (
										<FavoriteBorderRounded />
									) : key === 'recentlyVisited' ? (
										<HistoryRounded />
									) : key === 'attendance' ? (
										<EventAvailableOutlined />
									) : (
										<ReceiptLongOutlined />
									)}
								</span>
							)}
							<span>{t(label)}</span>
							{user.memberType === 'ADMIN' && <ChevronRightRounded className="quwat-personal-nav-arrow" />}
						</Link>
					))}
					{user.memberType === 'ADMIN' && (
						<Link href="/_admin/products" passHref>
							<Inventory2Outlined className="quwat-personal-nav-icon" />
							<span>{t('Katalog boshqaruvi')}</span>
							<ChevronRightRounded className="quwat-personal-nav-arrow" />
						</Link>
					)}
				</aside>
				<div className="quwat-desktop-only quwat-account-support">
					<Button onClick={() => void logOut().then(() => router.push('/'))}>{t('Chiqish')}</Button>
					<Link href="/cs" passHref>
						<SupportAgentOutlined aria-hidden="true" />
						<strong>{t('Savollaringiz bormi?')}</strong>
						<span>{t('Yordam bo‘limi')}</span>
					</Link>
				</div>
			</div>
			<section>
				{selectedCategory === 'myProfile' && <MyProfile />}
				{selectedCategory === 'myFavorites' && <ProductList kind="favorites" />}
				{selectedCategory === 'recentlyVisited' && <ProductList kind="visited" />}
				{selectedCategory === 'saved' && user.memberType === 'CLIENT' && <ProductList kind="saved" />}
				{selectedCategory === 'attendance' && user.memberType === 'AGENT' && <MyAttendance key={user._id} />}
				{selectedCategory === 'orders' && user.memberType === 'CLIENT' && <SalesPanel key={user._id} kind="client" />}
				{selectedCategory === 'payments' && user.memberType === 'AGENT' && <SalesPanel key={user._id} kind="agent" />}
			</section>
		</div>
	);
}
function MyPage() {
	return (
		<SessionGate>
			<Account />
		</SessionGate>
	);
}
export default withLayoutBasic(MyPage);
