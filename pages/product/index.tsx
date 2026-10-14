import { useText } from '../../libs/i18n';
import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Pagination, Stack, Typography } from '@mui/material';
import { serverSideTranslations } from '../../libs/serverTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import ProductCard from '../../libs/components/product/ProductCard';
import ProductFilter from '../../libs/components/product/ProductFilter';
import QueryState from '../../libs/components/common/QueryState';
import { GET_PRODUCTS } from '../../apollo/user/product';
import { Products, ProductsInquiry } from '../../libs/types/product/product';
import { parseInquiry, totalOf } from '../../libs/product';
import { sessionVar } from '../../apollo/store';
const CATALOG_PAGE_SIZE = 18;
export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
function Catalog() {
	const { t, locale } = useText();
	const router = useRouter();
	const session = useReactiveVar(sessionVar);
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
		<Stack className="quwat-page" spacing={3}>
			<Typography variant="h4">{t('Mahsulotlar')}</Typography>
			<div className="quwat-catalog-layout">
				<aside>
					<ProductFilter inquiry={inquiry} onChange={change} />
				</aside>
				<Stack spacing={3}>
					<QueryState loading={loading && !data} error={error} retry={() => refetch()} />
					{data && (
						<>
							<Typography color="text.secondary">
								{t('{{count}} ta mahsulot', { count: totalOf(data.getProducts) })}
							</Typography>
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
