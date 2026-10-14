import { useText } from '../../i18n';
import React, { FormEvent, useState } from 'react';
import { Button, InputAdornment, MenuItem, Stack, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useRouter } from 'next/router';
import { ProductType, productTypeLabels } from '../../enums/product.enum';
export default function HeaderFilter() {
	const { t } = useText();
	const [text, setText] = useState('');
	const [type, setType] = useState('');
	const router = useRouter();
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
		<Stack component="form" className="quwat-hero-search" onSubmit={submit}>
			<TextField
				label={t('Mahsulot nomi')}
				variant="outlined"
				value={text}
				onChange={(e) => setText(e.target.value)}
				inputProps={{ maxLength: 100 }}
				InputProps={{
					startAdornment: (
						<InputAdornment position="start">
							<SearchIcon />
						</InputAdornment>
					),
				}}
				fullWidth
			/>
			<TextField
				label={t('Kategoriya')}
				select
				variant="outlined"
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
			<Button
				className="quwat-hero-search-submit"
				variant="contained"
				type="submit"
				startIcon={<SearchIcon />}
				aria-label={t('Katalogdan qidirish')}
			>
				{t('Mahsulot qidirish')}
			</Button>
		</Stack>
	);
}
