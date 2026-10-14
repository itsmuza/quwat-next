import { useText } from '../../i18n';
import React, { FormEvent, useState } from 'react';
import { MenuItem, Stack, TextField, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useRouter } from 'next/router';
import { ProductType, ProductUnit, productTypeLabels, unitLabels } from '../../enums/product.enum';
export default function HeaderFilter() {
	const { t } = useText();
	const [text, setText] = useState('');
	const [type, setType] = useState('');
	const [unit, setUnit] = useState('');
	const router = useRouter();
	function submit(event: FormEvent) {
		event.preventDefault();
		const search = {
			...(text.trim() ? { text: text.trim() } : {}),
			...(type ? { typeList: [type] } : {}),
			...(unit ? { unitList: [unit] } : {}),
		};
		void router.push({
			pathname: '/product',
			query: { input: JSON.stringify({ page: 1, limit: 20, sort: 'createdAt', direction: 'DESC', search }) },
		});
	}
	return (
		<Stack component="form" className="search-box" onSubmit={submit}>
			<Stack className="select-box">
				<div className="box">
					<TextField
						label={t('Mahsulot nomi')}
						variant="standard"
						value={text}
						onChange={(e) => setText(e.target.value)}
						inputProps={{ maxLength: 100 }}
					/>
				</div>
				<div className="box">
					<TextField
						label={t('Kategoriya')}
						select
						variant="standard"
						value={type}
						onChange={(e) => setType(e.target.value)}
						fullWidth
					>
						<MenuItem value="">{t('Barchasi')}</MenuItem>
						{Object.values(ProductType).map((v) => (
							<MenuItem key={v} value={v}>
								{t(productTypeLabels[v])}
							</MenuItem>
						))}
					</TextField>
				</div>
				<div className="box">
					<TextField
						label={t('Birlik')}
						select
						variant="standard"
						value={unit}
						onChange={(e) => setUnit(e.target.value)}
						fullWidth
					>
						<MenuItem value="">{t('Barchasi')}</MenuItem>
						{Object.values(ProductUnit).map((v) => (
							<MenuItem key={v} value={v}>
								{t(unitLabels[v])}
							</MenuItem>
						))}
					</TextField>
				</div>
			</Stack>
			<Stack className="search-box-other">
				<span>{t('Mahsulot qidirish')}</span>
				<IconButton className="search-btn" type="submit" aria-label={t('Katalogdan qidirish')}>
					<SearchIcon />
				</IconButton>
			</Stack>
		</Stack>
	);
}
