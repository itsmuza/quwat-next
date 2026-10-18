import { useText } from '../../libs/i18n';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded';
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
	const panelRef = useRef<HTMLElement>(null);
	const [panelMinHeight, setPanelMinHeight] = useState(0);
	const preservePanelHeight = () => {
		const height = panelRef.current?.getBoundingClientRect().height || 0;
		setPanelMinHeight((previous) => Math.max(previous, height));
	};
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
			<aside
				className={`quwat-side${user.memberType === 'ADMIN' ? ' quwat-admin-personal-nav' : ''}`}
				aria-label={t('Shaxsiy bo‘limlar')}
			>
				{menu.map(([key, label]) => (
					<Link
						key={key}
						href={{ pathname: '/mypage', query: { category: key } }}
						passHref
						shallow
						scroll={false}
						onClick={preservePanelHeight}
						aria-current={selectedCategory === key ? 'page' : undefined}
					>
						{user.memberType === 'ADMIN' && <PersonOutlineRounded className="quwat-personal-nav-icon" />}
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
			<section ref={panelRef} style={{ '--quwat-panel-min-height': `${panelMinHeight}px` } as React.CSSProperties}>
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
