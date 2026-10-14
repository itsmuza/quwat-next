import { useText } from '../../i18n';
import React from 'react';
import Link from 'next/link';
import { Stack, Typography } from '@mui/material';
import { Product } from '../../types/product/product';
import { unitLabels } from '../../enums/product.enum';
import { money } from '../../product';
import ProductImage from './ProductImage';
import ProductActions from './ProductActions';
export default function ProductCard({ product, onChanged }: { product: Product; onChanged?: () => unknown }) {
	const { t, locale } = useText();
	const active = product.productStatus === 'ACTIVE';
	const available = Math.max(0, product.productQuantity - product.productReservedQuantity);
	const quantity = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
	const route = { pathname: '/product/detail', query: { id: product._id } };
	const picture = (
		<div className="quwat-product-image card-img">
			<ProductImage
				key={product.productImages[0] || 'empty'}
				path={product.productImages[0]}
				name={product.productName}
				width={300}
				height={230}
			/>
		</div>
	);
	return (
		<Stack className="quwat-product-card trend-card-box">
			{active ? <Link href={route}>{picture}</Link> : picture}
			<div className="info">
				<div className="price-box">{money(product.productPrice, locale)}</div>
				<div className="title">{active ? <Link href={route}>{product.productName}</Link> : product.productName}</div>
				{product.productBrand && <p className="desc">{product.productBrand}</p>}
				<div className="quwat-stock">
					<Typography variant="body2">
						{t('Omborda:')} {quantity.format(product.productQuantity)} {t(unitLabels[product.productUnit])}
					</Typography>
					{active && product.productReservedQuantity > 0 && (
						<Typography variant="body2" color="text.secondary">
							{t('Sotuvga mavjud:')} {quantity.format(available)} {t(unitLabels[product.productUnit])}
						</Typography>
					)}
				</div>
				<div className="bott">
					{!active && (
						<Typography variant="body2" color="text.secondary">
							{t('Sotuvda yo‘q')}
						</Typography>
					)}
					<ProductActions product={product} onChanged={onChanged} />
				</div>
			</div>
		</Stack>
	);
}
