import { useText } from '../../i18n';
import React, { FormEvent, useEffect, useState } from 'react';
import { Alert, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField } from '@mui/material';
import { ProductsInquiry } from '../../types/product/product';
import { ProductType, ProductUnit, productTypeLabels, unitLabels } from '../../enums/product.enum';
import { parseInquiry, productSorts } from '../../product';
const sortLabels = {
	createdAt: 'Yangi mahsulotlar',
	updatedAt: 'Yangilanganlar',
	productLikes: 'Yoqtirishlar',
	productViews: 'Ko‘rishlar',
	productRank: 'Reyting',
	productPrice: 'Narx',
};
export default function ProductFilter({
	inquiry,
	onChange,
}: {
	inquiry: ProductsInquiry;
	onChange: (value: ProductsInquiry) => void;
}) {
	const { t, errorMessage: translateError } = useText();
	const [form, setForm] = useState({
		text: '',
		type: '',
		unit: '',
		brand: '',
		start: '',
		end: '',
		from: '',
		to: '',
		inStock: false,
	});
	const [error, setError] = useState('');
	useEffect(() => {
		const s = inquiry.search;
		setForm({
			text: s.text || '',
			type: s.typeList?.[0] || '',
			unit: s.unitList?.[0] || '',
			brand: s.brandList?.join(', ') || '',
			start: s.pricesRange?.start?.toString() || '',
			end: s.pricesRange?.end?.toString() || '',
			from: s.periodsRange?.start?.slice(0, 10) || '',
			to: s.periodsRange?.end?.slice(0, 10) || '',
			inStock: s.inStock || false,
		});
	}, [inquiry]);
	function submit(event: FormEvent) {
		event.preventDefault();
		setError('');
		if (
			[form.start, form.end].some((v) => v && (!Number.isSafeInteger(Number(v)) || Number(v) < 0)) ||
			(form.start && form.end && Number(form.start) > Number(form.end)) ||
			(form.from && form.to && form.from > form.to)
		) {
			setError('Narx yoki sana oralig‘ini tekshiring.');
			return;
		}
		const search = {
			text: form.text,
			typeList: form.type ? [form.type] : [],
			unitList: form.unit ? [form.unit] : [],
			brandList: form.brand.split(','),
			pricesRange: { start: form.start ? Number(form.start) : undefined, end: form.end ? Number(form.end) : undefined },
			periodsRange: {
				start: form.from ? `${form.from}T00:00:00.000Z` : undefined,
				end: form.to ? `${form.to}T23:59:59.999Z` : undefined,
			},
			...(form.inStock ? { inStock: true } : {}),
		};
		onChange(parseInquiry(JSON.stringify({ ...inquiry, page: 1, search })));
	}
	return (
		<Stack component="form" onSubmit={submit} spacing={2} className="quwat-filter">
			<div className="quwat-filter-grid">
				<TextField
					size="small"
					label={t('Mahsulot qidirish')}
					value={form.text}
					onChange={(e) => setForm({ ...form, text: e.target.value })}
					inputProps={{ maxLength: 100 }}
				/>
				<TextField
					select
					size="small"
					label={t('Kategoriya')}
					value={form.type}
					onChange={(e) => setForm({ ...form, type: e.target.value })}
				>
					<MenuItem value="">{t('Barchasi')}</MenuItem>
					{Object.values(ProductType).map((v) => (
						<MenuItem key={v} value={v}>
							{t(productTypeLabels[v])}
						</MenuItem>
					))}
				</TextField>
				<TextField
					select
					size="small"
					label={t('Birlik')}
					value={form.unit}
					onChange={(e) => setForm({ ...form, unit: e.target.value })}
				>
					<MenuItem value="">{t('Barchasi')}</MenuItem>
					{Object.values(ProductUnit).map((v) => (
						<MenuItem key={v} value={v}>
							{t(unitLabels[v])}
						</MenuItem>
					))}
				</TextField>
				<TextField
					size="small"
					label={t('Brand (vergul bilan)')}
					value={form.brand}
					onChange={(e) => setForm({ ...form, brand: e.target.value })}
				/>
				{(['start', 'end'] as const).map((key) => (
					<TextField
						key={key}
						size="small"
						label={key === 'start' ? t('Minimal narx (so‘m)') : t('Maksimal narx (so‘m)')}
						type="number"
						inputProps={{ min: 0, step: 1 }}
						value={form[key]}
						onChange={(e) => setForm({ ...form, [key]: e.target.value })}
					/>
				))}
				{(['from', 'to'] as const).map((key) => (
					<TextField
						key={key}
						size="small"
						label={key === 'from' ? t('Yaratilgan sana: dan') : t('Yaratilgan sana: gacha')}
						type="date"
						InputLabelProps={{ shrink: true }}
						value={form[key]}
						onChange={(e) => setForm({ ...form, [key]: e.target.value })}
					/>
				))}
				<TextField
					select
					size="small"
					label={t('Saralash')}
					value={inquiry.sort || 'createdAt'}
					onChange={(e) => onChange({ ...inquiry, page: 1, sort: e.target.value as ProductsInquiry['sort'] })}
				>
					{productSorts.map((v) => (
						<MenuItem key={v} value={v}>
							{t(sortLabels[v])}
						</MenuItem>
					))}
				</TextField>
				<TextField
					select
					size="small"
					label={t('Tartib')}
					value={inquiry.direction || 'DESC'}
					onChange={(e) => onChange({ ...inquiry, page: 1, direction: e.target.value as 'ASC' | 'DESC' })}
				>
					<MenuItem value="DESC">{t('Kamayish')}</MenuItem>
					<MenuItem value="ASC">{t('O‘sish')}</MenuItem>
				</TextField>
			</div>
			<Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
				<FormControlLabel
					control={
						<Checkbox checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} />
					}
					label={t('Faqat mavjud mahsulotlar')}
				/>
				<Button variant="contained" type="submit">
					{t('Qidirish')}
				</Button>
				<Button
					onClick={() => {
						setError('');
						onChange({ page: 1, limit: 20, sort: 'createdAt', direction: 'DESC', search: {} });
					}}
				>
					{t('Tozalash')}
				</Button>
			</Stack>
			{error && <Alert severity="error">{translateError(error)}</Alert>}
		</Stack>
	);
}
