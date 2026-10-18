import React, { Suspense, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Canvas, useThree } from '@react-three/fiber';
import { Preload, Image as SceneImage } from '@react-three/drei';
import { IconButton } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { motion, useReducedMotion } from 'framer-motion';
import { ScrollControls, Scroll } from './ScrollControls';
import { useText } from '../../i18n';

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
				const y = compact ? (large ? 0.15 : -0.34) * height : large ? 0 : (slot === 1 ? 1 : -1) * height * 0.24;
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

export default function FiberContainer() {
	const { t } = useText();
	const reducedMotion = useReducedMotion();
	const gallery = useRef<HTMLDivElement>(null);
	const move = useCallback((direction: number) => {
		const scroller = gallery.current?.querySelector<HTMLDivElement>('.quwat-fiber-scroll');
		if (scroller) scroller.scrollBy({ left: direction * scroller.clientWidth, behavior: 'auto' });
	}, []);
	useEffect(() => {
		if (reducedMotion) return;
		const timer = window.setInterval(() => {
			if (!document.hidden) move(1);
		}, 3000);
		return () => window.clearInterval(timer);
	}, [move, reducedMotion]);
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
				<p>{t('Asboblar va qurilish buyumlarini toping.')}</p>
				<Link href="/product" className="quwat-build-link">
					{t('Katalogni ko‘rish →')}
				</Link>
			</motion.div>
			<div className="quwat-build-gallery">
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
