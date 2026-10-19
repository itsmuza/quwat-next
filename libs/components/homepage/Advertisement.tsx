import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { IconButton, Stack } from '@mui/material';
import PauseRoundedIcon from '@mui/icons-material/PauseRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Autoplay, Pagination, Swiper as SwiperInstance } from 'swiper';
import { useReducedMotion } from 'framer-motion';
import { useText } from '../../i18n';

const photos = ['fastening', 'bricklaying', 'drilling', 'plumbing', 'electrical', 'painting'];

const Advertisement = () => {
	const { t } = useText();
	const reducedMotion = useReducedMotion();
	const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
	const [paused, setPaused] = useState(false);
	useEffect(() => {
		if (!swiper || swiper.destroyed) return;
		if (paused || reducedMotion) swiper.autoplay.stop();
		else swiper.autoplay.start();
	}, [swiper, paused, reducedMotion]);
	const playbackLabel = t(paused ? 'Rasmlar almashishini davom ettirish' : 'Rasmlar almashishini to‘xtatish');
	return (
		<Stack component="section" className="video-frame quwat-advertisement" aria-label={t('Qurilish jarayonlari')}>
			<div className="quwat-advertisement-copy">
				<h2>{t('Qurilish rejangizga mos mahsulotlarni toping.')}</h2>
				<p>{t('Asboblar va qurilish buyumlarini toping.')}</p>
				<Link passHref href="/product">
					{t('Katalogni ko‘rish →')}
					<ArrowForwardRoundedIcon aria-hidden="true" />
				</Link>
			</div>
			<Swiper
				className="quwat-advertisement-slider"
				modules={[A11y, Autoplay, Pagination]}
				onSwiper={setSwiper}
				slidesPerView={1}
				loop
				speed={reducedMotion ? 0 : 700}
				grabCursor
				autoplay={{ delay: 3000, disableOnInteraction: false }}
				pagination={{ el: '.quwat-advertisement-pagination', clickable: true }}
				a11y={{ paginationBulletMessage: t('{{index}}-rasmga o‘tish') }}
			>
				{photos.map((photo) => (
					<SwiperSlide key={photo}>
						<Image
							unoptimized
							loading="eager"
							src={`/img/fiber/quwat-${photo}.webp`}
							alt={t('Qurilish jarayonlari')}
							fill
							sizes="100vw"
							style={{ objectFit: 'cover' }}
						/>
					</SwiperSlide>
				))}
			</Swiper>
			<div className="quwat-advertisement-controls">
				<div className="quwat-advertisement-pagination" />
				{!reducedMotion && (
					<IconButton aria-label={playbackLabel} title={playbackLabel} onClick={() => setPaused(!paused)}>
						{paused ? <PlayArrowRoundedIcon /> : <PauseRoundedIcon />}
					</IconButton>
				)}
			</div>
		</Stack>
	);
};

export default Advertisement;
