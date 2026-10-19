import { useText } from '../../libs/i18n';
import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Pagination, Stack, Typography, TextField, MenuItem, Button, Drawer, IconButton } from '@mui/material';
import { serverSideTranslations } from '../../libs/serverTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import ProductCard from '../../libs/components/product/ProductCard';
import ProductFilter from '../../libs/components/product/ProductFilter';
import QueryState from '../../libs/components/common/QueryState';
import { GET_PRODUCTS } from '../../apollo/user/product';
import { Products, ProductsInquiry } from '../../libs/types/product/product';
import { parseInquiry, totalOf, productSorts } from '../../libs/product';
import { sessionVar } from '../../apollo/store';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { ProductType, productTypeLabels } from '../../libs/enums/product.enum';
const CATALOG_PAGE_SIZE = 18;
export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
function Catalog() {
	const { t, locale } = useText();
	const router = useRouter();
	const session = useReactiveVar(sessionVar);
	const [filterOpen, setFilterOpen] = useState(false);
	const [mobileSearch, setMobileSearch] = useState('');
	const inquiry = useMemo(
		() => ({ ...parseInquiry(router.query.input), limit: CATALOG_PAGE_SIZE }),
		[router.query.input],
	);
	const { data, loading, error, refetch } = useQuery<{ getProducts: Products }, { input: ProductsInquiry }>(
		GET_PRODUCTS,
		{
			variables: { input: inquiry },
			skip: !router.isReady || session.status === 'loading',
			fetchPolicy: 'cache-and-network',
		},
	);
	useEffect(() => {
		setMobileSearch(inquiry.search.text || '');
	}, [inquiry.search.text]);
	const change = (value: ProductsInquiry) => {
		void router.push(
			{ pathname: '/product', query: { input: JSON.stringify({ ...value, limit: CATALOG_PAGE_SIZE }) } },
			undefined,
			{
				shallow: true,
				scroll: false,
			},
		);
	};
	return (
		<Stack className="quwat-page quwat-catalog-page" spacing={3}>
			<div className="quwat-mobile-catalog-tools">
				<h1 className="quwat-mobile-catalog-title">{t('Mahsulotlar')}</h1>
				<nav className="quwat-mobile-category-chips" aria-label={t('Kategoriyalar')}>
					{['', ...Object.values(ProductType)].map((type) => (
						<button
							key={type}
							type="button"
							aria-pressed={
								type
									? inquiry.search.typeList?.includes(type as ProductType) || false
									: !inquiry.search.typeList?.length
							}
							onClick={() =>
								change({
									...inquiry,
									page: 1,
									search: { ...inquiry.search, typeList: type ? [type as ProductType] : [] },
								})
							}
						>
							{t(type ? productTypeLabels[type as ProductType] : 'Barchasi')}
						</button>
					))}
				</nav>
				<form
					className="quwat-mobile-catalog-search"
					onSubmit={(event) => {
						event.preventDefault();
						change({ ...inquiry, page: 1, search: { ...inquiry.search, text: mobileSearch.trim() } });
					}}
				>
					<SearchRoundedIcon aria-hidden="true" />
					<input
						id="catalog-mobile-search"
						aria-label={t('Mahsulot qidirish')}
						placeholder={t('Mahsulot qidirish')}
						maxLength={100}
						value={mobileSearch}
						onChange={(event) => setMobileSearch(event.target.value)}
					/>
					<Button type="submit">{t('Qidirish')}</Button>
				</form>
				<Button
					variant="outlined"
					startIcon={<TuneRoundedIcon />}
					aria-haspopup="dialog"
					aria-expanded={filterOpen}
					aria-controls={filterOpen ? 'mobile-product-filters' : undefined}
					onClick={() => setFilterOpen(true)}
				>
					{t('Filtrlar')}
				</Button>
			</div>
			<Drawer
				anchor="bottom"
				open={filterOpen}
				onClose={() => setFilterOpen(false)}
				className="quwat-mobile-filter-drawer"
				PaperProps={{
					id: 'mobile-product-filters',
					role: 'dialog',
					'aria-modal': true,
					'aria-labelledby': 'mobile-product-filter-title',
				}}
			>
				<div className="quwat-mobile-filter-heading">
					<h2 id="mobile-product-filter-title">{t('Filtrlar')}</h2>
					<IconButton aria-label={t('Menyuni yopish')} onClick={() => setFilterOpen(false)}>
						<CloseRoundedIcon />
					</IconButton>
				</div>
				<ProductFilter
					inquiry={inquiry}
					onChange={(value) => {
						change(value);
						setFilterOpen(false);
					}}
				/>
			</Drawer>
			<Typography variant="h4">{t('Mahsulotlar')}</Typography>
			<div className="quwat-catalog-layout">
				<aside>
					<h2 className="quwat-desktop-only quwat-filter-heading">{t('Filtrlar')}</h2>
					<ProductFilter inquiry={inquiry} onChange={change} />
				</aside>
				<Stack spacing={3} className="quwat-catalog-results">
					<QueryState loading={loading && !data} error={error} retry={() => refetch()} />
					{data && (
						<>
							<div className="quwat-catalog-toolbar">
								<Typography color="text.secondary">
									{t('{{count}} ta mahsulot', { count: totalOf(data.getProducts) })}
								</Typography>
								<div className="quwat-desktop-only quwat-catalog-sort">
									<TextField
										select
										size="small"
										label={t('Saralash')}
										value={inquiry.sort || 'createdAt'}
										onChange={(e) => change({ ...inquiry, page: 1, sort: e.target.value as ProductsInquiry['sort'] })}
									>
										{productSorts.map((key) => (
											<MenuItem key={key} value={key}>
												{t(
													{
														createdAt: 'Yangi mahsulotlar',
														updatedAt: 'Yangilanganlar',
														productLikes: 'Yoqtirishlar',
														productViews: 'Ko‘rishlar',
														productRank: 'Reyting',
														productPrice: 'Narx',
													}[key],
												)}
											</MenuItem>
										))}
									</TextField>
									<TextField
										select
										size="small"
										label={t('Tartib')}
										value={inquiry.direction || 'DESC'}
										onChange={(e) => change({ ...inquiry, page: 1, direction: e.target.value as 'ASC' | 'DESC' })}
									>
										<MenuItem value="DESC">{t('Kamayish')}</MenuItem>
										<MenuItem value="ASC">{t('O‘sish')}</MenuItem>
									</TextField>
								</div>
							</div>
							<div className="quwat-product-grid">
								{data.getProducts.list.map((p) => (
									<ProductCard key={p._id} product={p} />
								))}
							</div>
							{!data.getProducts.list.length && (
								<Alert severity="info">{t('Mahsulot topilmadi. Filtrlarni o‘zgartiring.')}</Alert>
							)}
							<Pagination
								page={inquiry.page}
								count={Math.max(1, Math.ceil(totalOf(data.getProducts) / inquiry.limit))}
								onChange={(_, page) => change({ ...inquiry, page })}
							/>
						</>
					)}
				</Stack>
			</div>
		</Stack>
	);
}
export default withLayoutBasic(Catalog);
