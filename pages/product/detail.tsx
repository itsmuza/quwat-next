import { useText } from '../../libs/i18n';
import ProductImage from '../../libs/components/product/ProductImage';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Chip, Divider, Stack, Typography } from '@mui/material';
import { serverSideTranslations } from '../../libs/serverTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { GET_PRODUCT, GET_PRODUCTS } from '../../apollo/user/product';
import { sessionVar, userVar } from '../../apollo/store';
import { Product, Products } from '../../libs/types/product/product';
import { money, validId } from '../../libs/product';
import { imageUrl } from '../../libs/feedback';
import { productTypeLabels, statusLabels, unitLabels } from '../../libs/enums/product.enum';
import QueryState from '../../libs/components/common/QueryState';
import ProductActions from '../../libs/components/product/ProductActions';
import ProductCard from '../../libs/components/product/ProductCard';
import CommentThread from '../../libs/components/common/CommentThread';
import AdminProductActions from '../../libs/components/admin/AdminProductActions';
import useAdminProduct from '../../libs/components/admin/useAdminProduct';
import { restoreSession } from '../../libs/auth';
export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
function Detail() {
	const { t, locale } = useText();
	const router = useRouter();
	const id = router.query.id;
	const session = useReactiveVar(sessionVar);
	const user = useReactiveVar(userVar);
	const admin = session.status === 'authenticated' && user.memberType === 'ADMIN';
	const ready = router.isReady && validId(id) && session.status !== 'loading' && session.status !== 'error';
	const adminDetail = useAdminProduct(validId(id) ? id : undefined, ready && admin);
	const [slide, setSlide] = useState(0);
	useEffect(() => setSlide(0), [id]);
	const { data, loading, error, refetch } = useQuery<{ getProduct: Product }>(GET_PRODUCT, {
		variables: { productId: id },
		skip: !ready || (admin && adminDetail.product?.productStatus !== 'ACTIVE'),
		fetchPolicy: 'cache-and-network',
	});
	const viewerProduct = data && data.getProduct._id === id ? data.getProduct : undefined;
	const product = admin
		? adminDetail.product && {
				...adminDetail.product,
				meLiked: viewerProduct?.meLiked ?? adminDetail.product.meLiked,
				productLikes: viewerProduct?.productLikes ?? adminDetail.product.productLikes,
		  }
		: viewerProduct;
	const imageIndex = Math.min(slide, Math.max(0, (product?.productImages.length || 0) - 1));
	const active = product?.productStatus === 'ACTIVE';
	const related = useQuery<{ getProducts: Products }>(GET_PRODUCTS, {
		variables: { input: { page: 1, limit: 5, search: { typeList: product ? [product.productType] : [] } } },
		skip: !product || !active,
	});
	return (
		<Stack className="quwat-page" spacing={3}>
			<Link href={admin ? '/_admin/products' : '/product'}>← {admin ? t('Admin katalogi') : t('Mahsulotlar')}</Link>
			<QueryState
				loading={session.status === 'loading' || (admin ? adminDetail.loading : loading && !data)}
				error={session.status === 'error' ? new Error(session.error) : admin ? adminDetail.error : error}
				retry={session.status === 'error' ? restoreSession : admin ? adminDetail.refetch : () => refetch()}
			/>
			{admin && ready && !adminDetail.loading && !adminDetail.error && adminDetail.product === null && (
				<Alert severity="info">{t('Mahsulot topilmadi.')}</Alert>
			)}
			{router.isReady && !validId(id) && <Alert severity="warning">{t('Mahsulot manzili noto‘g‘ri.')}</Alert>}
			{product && (
				<>
					<div className="quwat-detail-grid">
						<Stack spacing={2}>
							<div className="quwat-detail-image">
								<ProductImage
									key={product.productImages[imageIndex] || 'empty'}
									path={product.productImages[imageIndex]}
									name={product.productName}
									width={600}
									height={420}
								/>
							</div>
							<Stack direction="row" gap={1} flexWrap="wrap">
								{product.productImages.map((image, index) => (
									<button
										className="quwat-thumbnail"
										key={image + index}
										onClick={() => setSlide(index)}
										aria-label={t('Rasm {{number}}', { number: index + 1 })}
										aria-pressed={imageIndex === index}
									>
										<Image unoptimized width={65} height={55} src={imageUrl(image)} alt="" />
									</button>
								))}
							</Stack>
						</Stack>
						<Stack spacing={2}>
							<Typography variant="h3">{product.productName}</Typography>
							<Typography color="text.secondary">
								{t(productTypeLabels[product.productType])}
								{product.productBrand ? ` · ${product.productBrand}` : ''}
							</Typography>
							<Typography variant="h5">
								{money(product.productPrice, locale)} / {t(unitLabels[product.productUnit])}
							</Typography>
							{admin && <Chip label={t(statusLabels[product.productStatus])} sx={{ alignSelf: 'flex-start' }} />}
							<Chip
								label={
									!active
										? t('Sotuvda yo‘q')
										: product.productQuantity - product.productReservedQuantity > 0
										? t('Mavjud')
										: t('Hozircha qoldiq yo‘q')
								}
								sx={{ alignSelf: 'flex-start' }}
							/>
							<Typography>
								{t('Omborda:')} {product.productQuantity} {t(unitLabels[product.productUnit])} {t('· Band qilingan:')}{' '}
								{product.productReservedQuantity} {t(unitLabels[product.productUnit])}
							</Typography>
							<Typography>
								{t('Minimum:')} {product.productMinOrderQuantity} {t(unitLabels[product.productUnit])} {t('· Qadam:')}{' '}
								{product.productQuantityStep}
							</Typography>
							<Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
								{product.productDesc || t('Tavsif kiritilmagan.')}
							</Typography>
							{admin && <AdminProductActions product={product} onChanged={adminDetail.refetch} />}
							{active && <ProductActions product={product} />}
							<Typography variant="body2" color="text.secondary">
								{product.productViews} {t('ko‘rish ·')} {product.productComments} {t('izoh')}
							</Typography>
						</Stack>
					</div>
					{active && (
						<>
							<Divider />
							<CommentThread key={product._id} targetId={product._id} group="PRODUCT" onChanged={() => refetch()} />
							<Typography variant="h5">{t('O‘xshash mahsulotlar')}</Typography>
							<div className="quwat-product-grid">
								{related.data?.getProducts.list
									.filter((p) => p._id !== product._id)
									.slice(0, 4)
									.map((p) => (
										<ProductCard key={p._id} product={p} />
									))}
							</div>
						</>
					)}
				</>
			)}
		</Stack>
	);
}
export default withLayoutBasic(Detail);
