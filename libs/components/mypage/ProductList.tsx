import { useText } from '../../i18n';
import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Alert, Pagination, Stack, Typography } from '@mui/material';
import { GET_FAVORITE_PRODUCTS, GET_VISITED_PRODUCTS, GET_SAVED_PRODUCTS } from '../../../apollo/user/product';
import { Products } from '../../types/product/product';
import { totalOf } from '../../product';
import QueryState from '../common/QueryState';
import ProductCard from '../product/ProductCard';
export default function ProductList({ kind }: { kind: 'favorites' | 'visited' | 'saved' }) {
	const { t } = useText();
	const [page, setPage] = useState(1);
	const query =
		kind === 'favorites' ? GET_FAVORITE_PRODUCTS : kind === 'visited' ? GET_VISITED_PRODUCTS : GET_SAVED_PRODUCTS;
	const { data, loading, error, refetch } = useQuery<{
		getFavorites?: Products;
		getVisited?: Products;
		getSavedProducts?: Products;
	}>(query, { variables: { input: { page, limit: 20 } }, fetchPolicy: 'network-only' });
	const products = data?.getFavorites || data?.getVisited || data?.getSavedProducts;
	async function changed() {
		const result = await refetch();
		const list = result.data.getFavorites || result.data.getVisited || result.data.getSavedProducts;
		if (page > 1 && !list?.list.length) setPage(page - 1);
	}
	return (
		<Stack spacing={3}>
			<Typography variant="h4">
				{kind === 'favorites'
					? t('Yoqtirilgan mahsulotlar')
					: kind === 'visited'
					? t('Yaqinda ko‘rilganlar')
					: t('Saqlangan mahsulotlar')}
			</Typography>
			<QueryState loading={loading && !data} error={error} retry={() => refetch()} />
			<div className="quwat-product-grid">
				{products?.list.map((p) => (
					<ProductCard key={p._id} product={p} onChanged={changed} />
				))}
			</div>
			{products && !products.list.length && <Alert severity="info">{t('Ro‘yxat hozircha bo‘sh.')}</Alert>}
			<Pagination page={page} count={Math.max(1, Math.ceil(totalOf(products) / 20))} onChange={(_, v) => setPage(v)} />
		</Stack>
	);
}
