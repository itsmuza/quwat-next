import { useText } from '../i18n';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Stack } from '@mui/material';
import FacebookOutlinedIcon from '@mui/icons-material/FacebookOutlined';
import InstagramIcon from '@mui/icons-material/Instagram';
import TelegramIcon from '@mui/icons-material/Telegram';
import TwitterIcon from '@mui/icons-material/Twitter';
import { ProductType, productTypeLabels } from '../enums/product.enum';
export default function Footer() {
	const { t } = useText();
	return (
		<Stack className="footer-container">
			<Stack className="main">
				<Stack className="left">
					<div className="footer-box">
						<Link passHref href="/" className="quwat-original-brand">
							<Image src="/img/logo/logoText.svg" width={40} height={40} alt="" />
							<strong>Quwat</strong>
						</Link>
					</div>
					<div className="footer-box">
						<span>{t('Qurilish materiallari do‘koni')}</span>
						<p>{t('Kerakli mahsulotlar bir joyda')}</p>
					</div>
					<div className="footer-box">
						<span>{t('Savollaringiz bormi?')}</span>
						<Link href="/cs">{t('Yordam bo‘limi')}</Link>
					</div>
					<div className="footer-box">
						<p>{t('Ijtimoiy tarmoqlar')}</p>
						<div className="media-box">
							<FacebookOutlinedIcon />
							<TelegramIcon />
							<InstagramIcon />
							<TwitterIcon />
						</div>
					</div>
				</Stack>
				<Stack className="right">
					<div className="top">
						<strong>{t('Quwat mahsulotlar katalogi')}</strong>
						<p>{t('Asboblar va qurilish buyumlarini toping.')}</p>
					</div>
					<div className="bottom">
						<div>
							<strong>{t('Ommabop bo‘limlar')}</strong>
							<Link href="/product">{t('Barcha mahsulotlar')}</Link>
							<Link href="/agent">{t('Agentlar')}</Link>
						</div>
						<div>
							<strong>{t('Foydali havolalar')}</strong>
							<Link href="/about">{t('Biz haqimizda')}</Link>
							<Link href="/cs">{t('Yordam')}</Link>
							<Link href="/mypage">{t('Shaxsiy bo‘lim')}</Link>
						</div>
						<div>
							<strong>{t('Kategoriyalar')}</strong>
							{Object.values(ProductType)
								.slice(0, 4)
								.map((type) => (
									<Link
										key={type}
										href={{ pathname: '/product', query: { input: JSON.stringify({ search: { typeList: [type] } }) } }}
									>
										{t(productTypeLabels[type])}
									</Link>
								))}
						</div>
					</div>
				</Stack>
			</Stack>
			<Stack className="second">
				<span>
					{t('© Quwat — Barcha huquqlar himoyalangan.')} {new Date().getFullYear()}
				</span>
				<span>Quwat</span>
			</Stack>
		</Stack>
	);
}
