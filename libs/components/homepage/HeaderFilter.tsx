import { useText } from '../../i18n';
import React, { FormEvent, useEffect, useState } from 'react';
import { Button, InputAdornment, MenuItem, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useRouter } from 'next/router';
import { ProductType, productTypeLabels } from '../../enums/product.enum';
import { motion, MotionConfig, useAnimationControls, useReducedMotion, Variants } from 'framer-motion';

const MotionButton = motion.create(Button);
const fieldVariants: Variants = {
	enter: (index: number) => ({
		y: [6, 0],
		opacity: [0.92, 1],
		transition: { duration: 0.3, delay: 0.06 * index, ease: 'easeOut' },
	}),
};

export default function HeaderFilter({ compact = false }: { compact?: boolean }) {
	const { t } = useText();
	const reducedMotion = useReducedMotion();
	const entrance = useAnimationControls();
	const [text, setText] = useState('');
	const [type, setType] = useState('');
	const router = useRouter();
	useEffect(() => {
		if (reducedMotion) entrance.set({ opacity: 1, y: 0 });
		else void entrance.start('enter');
		return () => entrance.stop();
	}, [reducedMotion, entrance]);
	function submit(event: FormEvent) {
		event.preventDefault();
		const search = {
			...(text.trim() ? { text: text.trim() } : {}),
			...(type ? { typeList: [type] } : {}),
		};
		void router.push({
			pathname: '/product',
			query: { input: JSON.stringify({ page: 1, limit: 18, sort: 'createdAt', direction: 'DESC', search }) },
		});
	}
	return (
		<MotionConfig reducedMotion="user">
			<motion.form
				className="quwat-hero-search"
				id={compact ? 'home-search' : undefined}
				onSubmit={submit}
				initial={false}
				animate={entrance}
				variants={{ enter: { opacity: [0.9, 1], y: [12, 0], transition: { duration: 0.4, ease: 'easeOut' } } }}
			>
				<motion.div className="quwat-hero-search-field" initial={false} variants={fieldVariants} custom={0}>
					<TextField
						id={compact ? 'home-product-search' : undefined}
						placeholder={t('Mahsulot nomi')}
						variant="outlined"
						value={text}
						onChange={(e) => setText(e.target.value)}
						inputProps={{ maxLength: 100, 'aria-label': t('Mahsulot nomi') }}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchIcon />
								</InputAdornment>
							),
						}}
						fullWidth
					/>
				</motion.div>
				<motion.div className="quwat-hero-search-field" initial={false} variants={fieldVariants} custom={1}>
					<TextField
						select
						variant="outlined"
						value={type}
						onChange={(e) => setType(e.target.value)}
						fullWidth
						SelectProps={{
							displayEmpty: true,
							renderValue: (selected) => (selected ? t(productTypeLabels[selected as ProductType]) : t('Kategoriya')),
							SelectDisplayProps: { 'aria-label': t('Kategoriya') },
							MenuProps: { PaperProps: { className: 'quwat-hero-category-menu' } },
						}}
					>
						<MenuItem value="">{t('Barchasi')}</MenuItem>
						{Object.values(ProductType).map((v) => (
							<MenuItem key={v} value={v}>
								{t(productTypeLabels[v])}
							</MenuItem>
						))}
					</TextField>
				</motion.div>
				<MotionButton
					className="quwat-hero-search-submit"
					variant="contained"
					type="submit"
					startIcon={<SearchIcon />}
					aria-label={t('Katalogdan qidirish')}
					whileHover={reducedMotion ? undefined : { scale: 1.025, y: -1 }}
					whileTap={reducedMotion ? undefined : { scale: 0.97 }}
					transition={{ type: 'spring', stiffness: 400, damping: 28 }}
				>
					{t(compact ? 'Qidirish' : 'Mahsulot qidirish')}
				</MotionButton>
			</motion.form>
		</MotionConfig>
	);
}
