import { useText } from '../../libs/i18n';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
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
			'myFavorites',
			'recentlyVisited',
			...(user.memberType === 'CLIENT' ? ['saved', 'orders'] : []),
			...(user.memberType === 'AGENT' ? ['attendance', 'payments'] : []),
		],
		[user.memberType],
	);
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
	];
	return (
		<div id="my-page" className="quwat-page quwat-account">
			<aside className="quwat-side" aria-label={t('Shaxsiy bo‘limlar')}>
				{menu.map(([key, label]) => (
					<Link
						key={key}
						href={{ pathname: '/mypage', query: { category: key } }}
						shallow
						scroll={false}
						onClick={preservePanelHeight}
						aria-current={category === key ? 'page' : undefined}
					>
						{t(label)}
					</Link>
				))}
				{user.memberType === 'ADMIN' && <Link href="/_admin/products">{t('Katalog boshqaruvi')}</Link>}
			</aside>
			<section ref={panelRef} style={{ minHeight: panelMinHeight || undefined }}>
				{category === 'myProfile' && <MyProfile />}
				{category === 'myFavorites' && <ProductList kind="favorites" />}
				{category === 'recentlyVisited' && <ProductList kind="visited" />}
				{category === 'saved' && user.memberType === 'CLIENT' && <ProductList kind="saved" />}
				{category === 'attendance' && user.memberType === 'AGENT' && <MyAttendance key={user._id} />}
				{category === 'orders' && user.memberType === 'CLIENT' && <SalesPanel key={user._id} kind="client" />}
				{category === 'payments' && user.memberType === 'AGENT' && <SalesPanel key={user._id} kind="agent" />}
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
