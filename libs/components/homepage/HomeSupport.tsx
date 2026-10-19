import React from 'react';
import Link from 'next/link';
import ElectricalServicesOutlinedIcon from '@mui/icons-material/ElectricalServicesOutlined';
import PlumbingOutlinedIcon from '@mui/icons-material/PlumbingOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useReactiveVar } from '@apollo/client';
import { sessionVar, userVar } from '../../../apollo/store';
import { ProductType } from '../../enums/product.enum';
import { useText } from '../../i18n';

export function HomeSolutions() {
	const { t } = useText();
	return (
		<section className="quwat-home-solutions container" aria-labelledby="home-solutions-title">
			<h2 id="home-solutions-title">{t('Sohangiz uchun mahsulotlar')}</h2>
			<div>
				{[
					{ type: ProductType.ELEKTR_MOLLARI, title: 'Elektr mollari', Icon: ElectricalServicesOutlinedIcon },
					{ type: ProductType.SANTEXNIKA, title: 'Santexnika', Icon: PlumbingOutlinedIcon },
				].map(({ type, title, Icon }) => (
					<Link
						passHref
						key={type}
						href={{
							pathname: '/product',
							query: {
								input: JSON.stringify({
									page: 1,
									limit: 18,
									sort: 'createdAt',
									direction: 'DESC',
									search: { typeList: [type] },
								}),
							},
						}}
					>
						<Icon aria-hidden="true" />
						<h3>{t(title)}</h3>
						<span>
							{t('Katalogni ko‘rish →')}
							<ArrowForwardRoundedIcon aria-hidden="true" />
						</span>
					</Link>
				))}
			</div>
		</section>
	);
}

export function HomeServices() {
	const { t } = useText();
	const session = useReactiveVar(sessionVar);
	const user = useReactiveVar(userVar);
	const saved =
		session.status === 'authenticated' && user.memberType === 'CLIENT' ? '/mypage?category=saved' : '/account/join';
	const items = [
		{
			Icon: GridViewOutlinedIcon,
			title: 'Mahsulotlar katalogi',
			description: 'Kerakli mahsulotlar bir joyda',
			href: '/product',
		},
		{
			Icon: Inventory2OutlinedIcon,
			title: 'Narx va qoldiq',
			description: 'Narxlar va mavjud miqdorni ko‘ring',
			href: '/product',
		},
		{
			Icon: BookmarkBorderRoundedIcon,
			title: 'Saqlanganlar',
			description: 'Mahsulotlarni keyinroq ko‘rish uchun saqlang',
			href: saved,
		},
		{ Icon: SupportAgentRoundedIcon, title: 'Yordam bo‘limi', description: 'Savollaringiz bormi?', href: '/cs' },
	].filter(
		(item) => item.title !== 'Saqlanganlar' || session.status !== 'authenticated' || user.memberType === 'CLIENT',
	);
	return (
		<nav className="quwat-home-services container" aria-label={t('Foydali havolalar')}>
			{items.map(({ Icon, title, description, href }) => (
				<Link passHref key={title} href={href}>
					<Icon aria-hidden="true" />
					<div>
						<strong>{t(title)}</strong>
						<span>{t(description)}</span>
					</div>
				</Link>
			))}
		</nav>
	);
}
