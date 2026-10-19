import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useReactiveVar } from '@apollo/client';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import PeopleOutlineRoundedIcon from '@mui/icons-material/PeopleOutlineRounded';
import { sessionVar, userVar } from '../../../apollo/store';
import { useText } from '../../i18n';

export default function HomeNavigation({
	cart = false,
	onNavigate,
	onSearch,
}: { cart?: boolean; onNavigate?: () => void; onSearch?: () => void } = {}) {
	const { t } = useText();
	const router = useRouter();
	const session = useReactiveVar(sessionVar);
	const user = useReactiveVar(userVar);
	const signedIn = session.status === 'authenticated';
	const isAdmin = signedIn && user.memberType === 'ADMIN';
	const favorites = signedIn
		? user.memberType === 'ADMIN'
			? '/agent'
			: '/mypage?category=myFavorites'
		: '/account/join';
	return (
		<nav className="quwat-home-bottom-nav" aria-label={t('Asosiy menyu')}>
			<Link passHref href="/" onClick={onNavigate} aria-current={!cart && router.pathname === '/' ? 'page' : undefined}>
				<HomeOutlinedIcon />
				<span>{t('Bosh sahifa')}</span>
			</Link>
			<Link
				passHref
				href="/product"
				onClick={onNavigate}
				aria-current={!cart && router.pathname === '/product' ? 'page' : undefined}
			>
				<GridViewOutlinedIcon />
				<span>{t('Katalog')}</span>
			</Link>
			<button
				type="button"
				onClick={() => {
					if (onSearch) {
						onSearch();
						return;
					}
					onNavigate?.();
					const focusSearch = () => {
						(
							document.getElementById('catalog-mobile-search') || document.getElementById('home-product-search')
						)?.focus();
						window.scrollTo({ top: 0, behavior: 'auto' });
					};
					if (router.pathname === '/' || router.pathname === '/product') focusSearch();
					else void router.push('/product').then(focusSearch);
				}}
			>
				<SearchRoundedIcon />
				<span>{t('Qidirish')}</span>
			</button>
			<Link
				passHref
				onClick={onNavigate}
				href={favorites}
				aria-current={
					(
						isAdmin
							? router.pathname === '/agent'
							: !cart && signedIn && router.pathname === '/mypage' && router.query.category === 'myFavorites'
					)
						? 'page'
						: undefined
				}
			>
				{isAdmin ? <PeopleOutlineRoundedIcon /> : <FavoriteBorderRoundedIcon />}
				<span>{t(isAdmin ? 'Agentlar' : 'Yoqtirilganlar')}</span>
			</Link>
			{cart ? (
				<button
					type="button"
					aria-current="page"
					onClick={() => document.getElementById('quwat-cart-body')?.scrollTo({ top: 0, behavior: 'auto' })}
				>
					<ShoppingCartOutlinedIcon />
					<span>{t('Savatcha')}</span>
				</button>
			) : (
				<Link
					passHref
					onClick={onNavigate}
					href={signedIn ? '/mypage' : '/account/join'}
					aria-current={
						(router.pathname === '/mypage' && router.query.category !== 'myFavorites') ||
						router.pathname === '/account/join'
							? 'page'
							: undefined
					}
				>
					<PersonOutlineRoundedIcon />
					<span>{t('Profil')}</span>
				</Link>
			)}
		</nav>
	);
}
