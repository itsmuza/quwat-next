import { useText } from '../../i18n';
import React, { useRef } from 'react';
import Link from 'next/link';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Stack } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { A11y, Mousewheel, Pagination } from 'swiper';
import { GET_PRODUCTS } from '../../../apollo/user/product';
import { Products, ProductSort } from '../../types/product/product';
import { sessionVar } from '../../../apollo/store';
import ProductCard from '../product/ProductCard';
import QueryState from '../common/QueryState';
import HomeSkeleton from './HomeSkeleton';
import MobileShelfControls from './MobileShelfControls';
export default function ProductShelf({ title, sort }: { title: string; sort: ProductSort }) {
	const { t } = useText();
	const session = useReactiveVar(sessionVar);
	const shelfRef = useRef<HTMLDivElement>(null);
	const descriptions: Partial<Record<ProductSort, string>> = {
		createdAt: 'Katalogga yaqinda qo‘shilgan mahsulotlar',
		productLikes: 'Ko‘pchilik yoqtirgan mahsulotlarni ko‘ring',
		productRank: 'Ko‘p ko‘rilgan va yoqtirilgan mahsulotlar',
	};
	const { data, loading, error, refetch } = useQuery<{ getProducts: Products }>(GET_PRODUCTS, {
		variables: { input: { page: 1, limit: 8, sort, direction: 'DESC', search: {} } },
		skip: session.status === 'loading',
		fetchPolicy: 'cache-and-network',
	});
	const showSkeleton = session.status === 'loading' || (loading && !data);
	const productCount = data?.getProducts.list.length || 0;
	return (
		<Stack
			component="section"
			aria-labelledby={`home-shelf-${sort}`}
			className={`trend-properties quwat-product-shelf ${sort === 'productLikes' ? 'quwat-popular-shelf' : ''}`}
		>
			<Stack className="container">
				<div className="info-box">
					<div className="left">
						<h2 id={`home-shelf-${sort}`}>{title}</h2>
						<p>{t(descriptions[sort] || 'Quwat mahsulotlar katalogi')}</p>
					</div>
					<Link
						passHref
						className="quwat-home-view-all"
						href={{
							pathname: '/product',
							query: {
								input: JSON.stringify({ page: 1, limit: 18, sort, direction: 'DESC', search: {} }),
							},
						}}
					>
						{t('Barchasini ko‘rish')}
						<ArrowForwardRoundedIcon aria-hidden="true" />
					</Link>
				</div>
				<QueryState error={error} retry={() => refetch()} />
				{showSkeleton ? (
					<HomeSkeleton />
				) : (
					<Stack className="card-box" ref={shelfRef}>
						<Swiper
							className="trend-property-swiper"
							aria-describedby={`home-shelf-hint-${sort}`}
							enabled={false}
							slidesPerView={1.15}
							spaceBetween={12}
							breakpoints={{
								601: { enabled: true, slidesPerView: 2, spaceBetween: 16 },
								900: { enabled: true, slidesPerView: 3, spaceBetween: 20 },
								1200: { enabled: true, spaceBetween: 20, slidesPerView: 4 },
							}}
							speed={400}
							grabCursor
							threshold={8}
							modules={[A11y, Mousewheel, Pagination]}
							mousewheel={{ forceToAxis: true, releaseOnEdges: true }}
							a11y={{
								prevSlideMessage: t('Oldingi mahsulotlar'),
								nextSlideMessage: t('Keyingi mahsulotlar'),
								paginationBulletMessage: t('{{index}}-mahsulotlar guruhiga o‘tish'),
							}}
							pagination={{ el: `.quwat-pagination-${sort}`, clickable: true }}
						>
							{data?.getProducts.list.map((p) => (
								<SwiperSlide className="trend-property-slide" key={p._id}>
									<ProductCard product={p} compact />
								</SwiperSlide>
							))}
						</Swiper>
					</Stack>
				)}
				<MobileShelfControls
					targetRef={shelfRef}
					selector=".swiper-wrapper"
					loading={showSkeleton}
					count={productCount}
					kind="products"
					hintId={`home-shelf-hint-${sort}`}
				/>
				<div className="quwat-carousel-pagination" hidden={!data?.getProducts.list.length}>
					<div className={`quwat-pagination-${sort}`} />
				</div>
				{data && !data.getProducts.list.length && <Alert severity="info">{t('Hozircha mahsulotlar yo‘q.')}</Alert>}
			</Stack>
		</Stack>
	);
}
