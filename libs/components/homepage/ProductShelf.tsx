import { useText } from '../../i18n';
import React from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Alert, IconButton, Stack } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination } from 'swiper';
import WestIcon from '@mui/icons-material/West';
import EastIcon from '@mui/icons-material/East';
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
		<Stack className={`trend-properties ${sort === 'productLikes' ? 'quwat-popular-shelf' : ''}`}>
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
						spaceBetween={25}
						modules={[Autoplay, Navigation, Pagination]}
						navigation={{ prevEl: `.quwat-prev-${sort}`, nextEl: `.quwat-next-${sort}` }}
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
					<IconButton className={`quwat-prev-${sort}`} aria-label={t('Oldingi mahsulotlar')}>
						<WestIcon />
					</IconButton>
					<div className={`quwat-pagination-${sort}`} />
					<IconButton className={`quwat-next-${sort}`} aria-label={t('Keyingi mahsulotlar')}>
						<EastIcon />
					</IconButton>
				</div>
				{data && !data.getProducts.list.length && <Alert severity="info">{t('Hozircha mahsulotlar yo‘q.')}</Alert>}
			</Stack>
		</Stack>
	);
}
