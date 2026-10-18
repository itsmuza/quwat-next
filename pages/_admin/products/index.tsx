import { useText } from '../../../libs/i18n';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useApolloClient } from '@apollo/client';
import { Alert, Button, Chip, MenuItem, Pagination, Stack, TextField, Typography } from '@mui/material';
import { serverSideTranslations } from '../../../libs/serverTranslations';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import { GET_ALL_PRODUCTS_BY_ADMIN, UPDATE_PRODUCT, REMOVE_PRODUCT_BY_ADMIN } from '../../../apollo/admin/product';
import { Product, Products, AllProductsInquiry, ProductUpdate } from '../../../libs/types/product/product';
import { ProductStatus, productTypeLabels, statusLabels, unitLabels } from '../../../libs/enums/product.enum';
import { defaultInquiry, money, totalOf } from '../../../libs/product';
import { errorText } from '../../../libs/feedback';
import ProductFilter from '../../../libs/components/product/ProductFilter';
import ProductForm from '../../../libs/components/admin/ProductForm';
import QueryState from '../../../libs/components/common/QueryState';
import { invalidateProductCatalog } from '../../../libs/adminProduct';
import PermanentDeleteButton from '../../../libs/components/admin/PermanentDeleteButton';
import ProductImage from '../../../libs/components/product/ProductImage';
const statusColors = {
	[ProductStatus.ACTIVE]: { color: '#1e6539', backgroundColor: '#eaf6ee', borderColor: '#a8d5b8' },
	[ProductStatus.DRAFT]: { color: '#8a4b08', backgroundColor: '#fff4df', borderColor: '#ebcc8d' },
	[ProductStatus.ARCHIVED]: { color: '#9f2924', backgroundColor: '#fceceb', borderColor: '#e8b4b0' },
};
export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
function AdminProducts() {
	const { t, locale, errorMessage: translateError } = useText();
	const quantityFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
	const client = useApolloClient();
	const [inquiry, setInquiry] = useState<AllProductsInquiry>({ ...defaultInquiry, search: {} });
	const [form, setForm] = useState<{ product?: Product } | null>(null);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState('');
	const { data, loading, error, refetch } = useQuery<
		{ getAllProductsByAdmin: Products },
		{ input: AllProductsInquiry }
	>(GET_ALL_PRODUCTS_BY_ADMIN, { variables: { input: inquiry }, fetchPolicy: 'network-only' });
	const [update] = useMutation<{ updateProduct: Product }, { input: ProductUpdate }>(UPDATE_PRODUCT);
	const [archive] = useMutation<{ removeProductByAdmin: Product }, { productId: string }>(REMOVE_PRODUCT_BY_ADMIN);
	const pageCount = Math.max(1, Math.ceil(totalOf(data?.getAllProductsByAdmin) / inquiry.limit));
	useEffect(() => {
		if (data && !loading && !error && inquiry.page > pageCount)
			setInquiry((current) => ({ ...current, page: pageCount }));
	}, [data, loading, error, inquiry.page, pageCount]);
	async function refresh() {
		invalidateProductCatalog(client);
		await refetch();
	}
	async function changeStatus(p: Product, status: ProductStatus) {
		if (
			!window.confirm(
				status === ProductStatus.ARCHIVED ? t('Mahsulot arxivlansinmi?') : t('Mahsulot sotuvga chiqarilsinmi?'),
			)
		)
			return;
		setBusy(true);
		setMessage('');
		try {
			if (status === ProductStatus.ARCHIVED) await archive({ variables: { productId: p._id } });
			else await update({ variables: { input: { _id: p._id, productStatus: status } } });
			await refresh();
		} catch (error) {
			setMessage(errorText(error));
		} finally {
			setBusy(false);
		}
	}
	return (
		<Stack className="quwat-page quwat-admin-catalog" spacing={2}>
			<Stack
				className="quwat-admin-catalog-heading"
				direction="row"
				justifyContent="space-between"
				flexWrap="wrap"
				gap={2}
			>
				<Typography variant="h4">{t('Mahsulot boshqaruvi')}</Typography>
				<Button variant="contained" onClick={() => setForm({})}>
					{t('Mahsulot qo‘shish')}
				</Button>
			</Stack>
			<ProductFilter
				inquiry={inquiry}
				onChange={(next) =>
					setInquiry({ ...next, search: { ...next.search, productStatus: inquiry.search.productStatus } })
				}
			/>
			<TextField
				select
				className="quwat-admin-catalog-status"
				size="small"
				label={t('Status')}
				value={inquiry.search.productStatus || ''}
				onChange={(e) =>
					setInquiry({
						...inquiry,
						page: 1,
						search: {
							...inquiry.search,
							productStatus: e.target.value ? (e.target.value as ProductStatus) : undefined,
						},
					})
				}
				sx={{ maxWidth: 280 }}
			>
				<MenuItem value="">{t('Barcha statuslar')}</MenuItem>
				{Object.values(ProductStatus).map((v) => (
					<MenuItem key={v} value={v}>
						{t(statusLabels[v])}
					</MenuItem>
				))}
			</TextField>
			{message && <Alert severity="error">{translateError(message)}</Alert>}
			<QueryState loading={loading && !data} error={error} retry={() => refetch()} />
			<div className="quwat-records">
				{data?.getAllProductsByAdmin.list.map((p) => (
					<article key={p._id} className="quwat-record quwat-admin-product">
						<Link
							passHref
							className="quwat-admin-product-image"
							href={{ pathname: '/product/detail', query: { id: p._id } }}
							aria-label={t('{{name}} tafsilotlarini ochish', { name: p.productName })}
						>
							<ProductImage
								key={p.productImages[0] || 'empty'}
								path={p.productImages[0]}
								name={p.productName}
								width={140}
								height={140}
							/>
						</Link>
						<Stack
							className="quwat-admin-product-heading"
							direction="row"
							gap={1}
							justifyContent="space-between"
							flexWrap="wrap"
						>
							<Typography variant="h6" component="h2">
								<Link href={{ pathname: '/product/detail', query: { id: p._id } }}>{p.productName}</Link>
							</Typography>
							<Chip
								label={t(statusLabels[p.productStatus])}
								size="small"
								variant="outlined"
								sx={{ ...statusColors[p.productStatus], fontWeight: 600 }}
								color={
									p.productStatus === ProductStatus.ACTIVE
										? 'success'
										: p.productStatus === ProductStatus.DRAFT
										? 'warning'
										: 'default'
								}
							/>
						</Stack>
						<dl className="quwat-admin-product-details">
							{[
								[t('Kategoriya'), t(productTypeLabels[p.productType])],
								[t('Brend'), p.productBrand || t('Ko‘rsatilmagan')],
								[t('Birlik narxi'), `${money(p.productPrice, locale)} / ${t(unitLabels[p.productUnit])}`],
								[t('Omborda jami'), `${quantityFormat.format(p.productQuantity)} ${t(unitLabels[p.productUnit])}`],
								[
									t('Band qilingan'),
									`${quantityFormat.format(p.productReservedQuantity)} ${t(unitLabels[p.productUnit])}`,
								],
								[
									t('Sotuvga mavjud'),
									`${quantityFormat.format(Math.max(0, p.productQuantity - p.productReservedQuantity))} ${t(
										unitLabels[p.productUnit],
									)}`,
								],
							].map(([label, value]) => (
								<div key={t(label)}>
									<dt>{t(label)}</dt>
									<dd>{value}</dd>
								</div>
							))}
						</dl>
						<Stack className="quwat-admin-product-actions" direction="row" gap={1} flexWrap="wrap">
							<PermanentDeleteButton
								kind="product"
								id={p._id}
								name={p.productName}
								disabled={busy}
								onBusy={setBusy}
								onDeleted={async () => {
									client.cache.evict({ id: client.cache.identify({ __typename: 'Product', _id: p._id }) });
									invalidateProductCatalog(client, p._id);
									await refresh();
								}}
							/>
							<Button
								variant="contained"
								sx={{ color: '#fff', backgroundColor: '#181a20', '&:hover': { backgroundColor: '#30333a' } }}
								disabled={busy}
								onClick={() => setForm({ product: p })}
							>
								{t('Tahrirlash')}
							</Button>
							{p.productStatus !== ProductStatus.ACTIVE && (
								<Button
									variant="contained"
									color="success"
									sx={{ color: '#fff' }}
									disabled={busy}
									onClick={() => void changeStatus(p, ProductStatus.ACTIVE)}
								>
									{p.productStatus === ProductStatus.ARCHIVED
										? t('Tiklash va sotuvga chiqarish')
										: t('Sotuvga chiqarish')}
								</Button>
							)}
							{p.productStatus !== ProductStatus.ARCHIVED && (
								<Button
									variant="contained"
									color="error"
									sx={{ color: '#fff' }}
									disabled={busy}
									onClick={() => void changeStatus(p, ProductStatus.ARCHIVED)}
								>
									{t('Arxivlash')}
								</Button>
							)}
						</Stack>
					</article>
				))}
			</div>
			{data && !data.getAllProductsByAdmin.list.length && <Alert severity="info">{t('Mahsulotlar yo‘q.')}</Alert>}
			<Pagination page={inquiry.page} count={pageCount} onChange={(_, page) => setInquiry({ ...inquiry, page })} />
			{form && <ProductForm product={form.product} close={() => setForm(null)} saved={refresh} />}
		</Stack>
	);
}
export default withAdminLayout(AdminProducts);
