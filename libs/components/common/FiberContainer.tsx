import React, { ReactNode, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Canvas, useThree } from '@react-three/fiber';
import { Preload, Image as SceneImage } from '@react-three/drei';
import { IconButton } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { motion, useReducedMotion } from 'framer-motion';
import { ScrollControls, Scroll } from './ScrollControls';
import { useText } from '../../i18n';
import { useQuery, useReactiveVar } from '@apollo/client';
import { GET_PRODUCTS } from '../../../apollo/user/product';
import { sessionVar } from '../../../apollo/store';
import { Products } from '../../types/product/product';

const photoGroups = [
	['tap-installation', 'paint-roller', 'cabinet-fastening'],
	['pipe-fittings', 'socket-installation', 'sealant-application'],
	['door-handle', 'tile-adhesive', 'tap-installation'],
];

function PhotoPage({ index }: { index: number }) {
	const {
		viewport: { width, height },
		size,
	} = useThree();
	const photos = photoGroups[((index % photoGroups.length) + photoGroups.length) % photoGroups.length];
	const compact = size.width < 560;
	return (
		// React Three Fiber's group accepts Three.js position coordinates.
		// eslint-disable-next-line react/no-unknown-property
		<group position={[width * index, 0, 0]}>
			{photos.map((photo, slot) => {
				const large = slot === 0;
				const x = compact ? (large ? 0 : (slot === 1 ? -1 : 1) * width * 0.245) : (large ? -0.17 : 0.32) * width;
				const y = compact ? (large ? -0.16 : 0.34) * height : large ? 0 : (slot === 1 ? 1 : -1) * height * 0.24;
				const photoWidth = width * (compact ? (large ? 0.96 : 0.47) : large ? 0.62 : 0.32);
				const photoHeight = height * (compact ? (large ? 0.64 : 0.3) : large ? 0.94 : 0.46);
				return (
					<SceneImage
						key={`${photo}-${slot}`}
						position={[x, y, 0]}
						scale={[photoWidth, photoHeight]}
						url={`/img/header/quwat-${photo}.webp`}
						toneMapped={false}
					/>
				);
			})}
		</group>
	);
}

export default function FiberContainer({ children }: { children?: ReactNode }) {
	const { t, locale } = useText();
	const session = useReactiveVar(sessionVar);
	// Share the newest shelf's query/cache; use the full catalog count, not its eight visible cards.
	const { data, loading } = useQuery<{ getProducts: Products }>(GET_PRODUCTS, {
		variables: { input: { page: 1, limit: 8, sort: 'createdAt', direction: 'DESC', search: {} } },
		skip: session.status === 'loading',
		fetchPolicy: 'cache-and-network',
	});
	const productCount = data ? data.getProducts.metaCounter?.[0]?.total ?? 0 : undefined;
	// Some browsers fall back to English for Uzbek; use the same grouping on server and client.
	const countLocale = locale === 'uz-Latn-UZ' ? 'ru-RU' : locale;
	const formatCount = (count?: number) => (count === undefined ? '—' : new Intl.NumberFormat(countLocale).format(count));
	const reducedMotion = useReducedMotion();
	const [paused, setPaused] = useState(false);
	const [galleryExpanded, setGalleryExpanded] = useState(false);
	const gallery = useRef<HTMLDivElement>(null);
	const move = useCallback((direction: number) => {
		const scroller = gallery.current?.querySelector<HTMLDivElement>('.quwat-fiber-scroll');
		if (scroller) scroller.scrollBy({ left: direction * scroller.clientWidth, behavior: 'auto' });
	}, []);
	useEffect(() => {
		if (reducedMotion || paused) return;
		const timer = window.setInterval(() => {
			if (!document.hidden) move(1);
		}, 3000);
		return () => window.clearInterval(timer);
	}, [move, reducedMotion, paused]);
	return (
		<section className="quwat-build-hero" aria-labelledby="quwat-build-title">
			<motion.div
				className="quwat-build-copy"
				initial={false}
				whileInView={{ opacity: [0.9, 1], y: reducedMotion ? 0 : [10, 0] }}
				viewport={{ once: true }}
				transition={{ duration: reducedMotion ? 0 : 0.4 }}
			>
				<span className="quwat-build-eyebrow">{t('Qurilish materiallari do‘koni')}</span>
				<h1 id="quwat-build-title">{t('Mustahkam ishlar shu yerdan boshlanadi.')}</h1>
				<p>
					{t(
						'Qurilish va ta’mirlash uchun kerakli asboblar va buyumlar. Mahsulotlarni, narxlarni va ombordagi qoldiqni bir joyda ko‘ring.',
					)}
				</p>
				<Link href="/product" className="quwat-build-link">
					{t('Katalogni ko‘rish →')}
				</Link>
				{children}
				<div className="quwat-home-hero-facts">
					<div aria-busy={session.status === 'loading' || (loading && !data)}>
						<strong>{formatCount(productCount)}</strong>
						<span>{t('Jami mahsulotlar')}</span>
					</div>
					<div>
						<strong>{formatCount(1000)}</strong>
						<span>{t('Mijozlar soni')}</span>
					</div>
					<div>
						<strong>{t('15 yil')}</strong>
						<span>{t('Tajriba')}</span>
					</div>
				</div>
			</motion.div>
			<button
				type="button"
				className="quwat-home-gallery-toggle"
				aria-expanded={galleryExpanded}
				aria-controls="home-build-gallery"
				onClick={() => setGalleryExpanded((expanded) => !expanded)}
			>
				{t('Qurilish jarayonlari')}
				{galleryExpanded ? <ArrowBackRoundedIcon aria-hidden="true" /> : <ArrowForwardRoundedIcon aria-hidden="true" />}
			</button>
			<div id="home-build-gallery" className={`quwat-build-gallery${galleryExpanded ? ' expanded' : ''}`}>
				<div
					ref={gallery}
					className="threeJSContainer"
					role="region"
					aria-label={t('Qurilish jarayonlari')}
					tabIndex={0}
					onKeyDown={(event) => {
						if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
							event.preventDefault();
							move(event.key === 'ArrowRight' ? 1 : -1);
						}
					}}
				>
					<Canvas gl={{ antialias: false }} dpr={[1, 1.5]}>
						<Suspense fallback={null}>
							<ScrollControls infinite horizontal damping={reducedMotion ? 1000 : 4} pages={4} distance={1}>
								<Scroll>
									{[-1, 0, 1, 2, 3, 4].map((index) => (
										<PhotoPage key={index} index={index} />
									))}
								</Scroll>
							</ScrollControls>
							<Preload />
						</Suspense>
					</Canvas>
				</div>
				<div className="quwat-build-gallery-footer">
					<span>
						<i aria-hidden="true" />
						{t('Qurilish jarayonlari')}
					</span>
					<div className="quwat-build-controls">
						{!reducedMotion && (
							<IconButton
								aria-label={t(paused ? 'Rasmlar almashishini davom ettirish' : 'Rasmlar almashishini to‘xtatish')}
								title={t(paused ? 'Rasmlar almashishini davom ettirish' : 'Rasmlar almashishini to‘xtatish')}
								onClick={() => setPaused((value) => !value)}
							>
								{paused ? <PlayArrowRoundedIcon /> : <PauseRoundedIcon />}
							</IconButton>
						)}
						<IconButton aria-label={t('Oldingi rasmlar')} onClick={() => move(-1)}>
							<ArrowBackRoundedIcon />
						</IconButton>
						<IconButton aria-label={t('Keyingi rasmlar')} onClick={() => move(1)}>
							<ArrowForwardRoundedIcon />
						</IconButton>
					</div>
				</div>
			</div>
		</section>
	);
}
