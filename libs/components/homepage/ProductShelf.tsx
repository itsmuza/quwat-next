import { useText } from '../../i18n';
import React from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Stack } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Mousewheel, Pagination } from 'swiper';
import { GET_PRODUCTS } from '../../../apollo/user/product';
import { Products, ProductSort } from '../../types/product/product';
import { sessionVar } from '../../../apollo/store';
import ProductCard from '../product/ProductCard';
import QueryState from '../common/QueryState';
export default function ProductShelf({ title, sort }: { title: string; sort: ProductSort }) {
	const { t } = useText();
	const session = useReactiveVar(sessionVar);
	const { data, loading, error, refetch } = useQuery<{ getProducts: Products }>(GET_PRODUCTS, {
		variables: { input: { page: 1, limit: 8, sort, direction: 'DESC', search: {} } },
		skip: session.status === 'loading',
		fetchPolicy: 'cache-and-network',
	});
	return (
		<Stack className={`trend-properties quwat-product-shelf ${sort === 'productLikes' ? 'quwat-popular-shelf' : ''}`}>
			<Stack className="container">
				<div className="info-box">
					<div className="left">
						<span>{title}</span>
						<p>{t('Quwat mahsulotlar katalogi')}</p>
					</div>
				</div>
				<QueryState loading={loading && !data} error={error} retry={() => refetch()} />
				<Stack className="card-box">
					<Swiper
						className="trend-property-swiper"
						slidesPerView="auto"
						spaceBetween={16}
						breakpoints={{ 768: { spaceBetween: 24 }, 1200: { spaceBetween: 24, slidesPerView: 4 } }}
						speed={400}
						grabCursor
						threshold={8}
						modules={[A11y, Mousewheel, Pagination]}
						mousewheel={{ forceToAxis: true, releaseOnEdges: true }}
						a11y={{
							paginationBulletMessage: t('{{index}}-mahsulotlar guruhiga o‘tish'),
						}}
						pagination={{ el: `.quwat-pagination-${sort}`, clickable: true }}
					>
						{data?.getProducts.list.map((p) => (
							<SwiperSlide className="trend-property-slide" key={p._id}>
								<ProductCard product={p} />
							</SwiperSlide>
						))}
					</Swiper>
				</Stack>
				<div className="quwat-carousel-pagination">
					<div className={`quwat-pagination-${sort}`} />
				</div>
				{data && !data.getProducts.list.length && <Alert severity="info">{t('Hozircha mahsulotlar yo‘q.')}</Alert>}
			</Stack>
		</Stack>
	);
}
