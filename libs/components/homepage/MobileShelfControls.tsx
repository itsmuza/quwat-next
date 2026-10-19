import React, { RefObject, useEffect, useState } from 'react';
import { IconButton } from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import { useText } from '../../i18n';

export default function MobileShelfControls({
	targetRef,
	selector,
	loading,
	count,
	kind,
	hintId,
}: {
	targetRef: RefObject<HTMLDivElement>;
	selector?: string;
	loading: boolean;
	count: number;
	kind: 'products' | 'agents';
	hintId: string;
}) {
	const { t } = useText();
	const [scroll, setScroll] = useState({ progress: 0, visibleRatio: 1, canPrevious: false, canNext: false });
	useEffect(() => {
		const wrapper = selector ? targetRef.current?.querySelector<HTMLDivElement>(selector) : targetRef.current;
		if (!wrapper) return;
		let frame = 0;
		const update = () => {
			if (!wrapper.clientWidth) return;
			const maxScroll = Math.max(0, wrapper.scrollWidth - wrapper.clientWidth);
			const left = Math.max(0, Math.min(maxScroll, wrapper.scrollLeft));
			setScroll({
				progress: maxScroll ? left / maxScroll : 0,
				visibleRatio: Math.min(1, wrapper.clientWidth / Math.max(1, wrapper.scrollWidth)),
				canPrevious: left > 1,
				canNext: maxScroll - left > 1,
			});
		};
		const scheduleUpdate = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(update);
		};
		update();
		wrapper.addEventListener('scroll', scheduleUpdate, { passive: true });
		window.addEventListener('resize', scheduleUpdate);
		const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleUpdate);
		observer?.observe(wrapper);
		return () => {
			cancelAnimationFrame(frame);
			wrapper.removeEventListener('scroll', scheduleUpdate);
			window.removeEventListener('resize', scheduleUpdate);
			observer?.disconnect();
		};
	}, [loading, count, targetRef, selector]);
	const scrollByCard = (direction: number) => {
		const wrapper = selector ? targetRef.current?.querySelector<HTMLDivElement>(selector) : targetRef.current;
		if (!wrapper) return;
		const first = wrapper.firstElementChild as HTMLElement | null;
		const second = first?.nextElementSibling as HTMLElement | null;
		const step = first && second ? second.offsetLeft - first.offsetLeft : wrapper.clientWidth;
		wrapper.scrollBy({
			left: direction * step,
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
		});
	};
	return (
		<div className="quwat-mobile-shelf-controls" hidden={loading || count < 2}>
			<p id={hintId}>
				<SwapHorizRoundedIcon aria-hidden="true" />
				{t(kind === 'agents' ? 'Boshqa agentlarni ko‘rish uchun suring' : 'Boshqa mahsulotlarni ko‘rish uchun suring')}
			</p>
			<div className="quwat-mobile-shelf-navigation">
				<IconButton
					aria-label={t(kind === 'agents' ? 'Oldingi agentlar' : 'Oldingi mahsulotlar')}
					disabled={!scroll.canPrevious}
					onClick={() => scrollByCard(-1)}
				>
					<ArrowBackRoundedIcon />
				</IconButton>
				<IconButton
					aria-label={t(kind === 'agents' ? 'Keyingi agentlar' : 'Keyingi mahsulotlar')}
					disabled={!scroll.canNext}
					onClick={() => scrollByCard(1)}
				>
					<ArrowForwardRoundedIcon />
				</IconButton>
				<div className="quwat-shelf-track" aria-hidden="true">
					<div
						className="quwat-shelf-scroll-thumb"
						style={{
							width: `${scroll.visibleRatio * 100}%`,
							transform: `translateX(${(1 / scroll.visibleRatio - 1) * scroll.progress * 100}%)`,
						}}
					/>
				</div>
			</div>
		</div>
	);
}
