import { useText } from '../../i18n';
import React from 'react';
import Link from 'next/link';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { Product } from '../../types/product/product';
import { unitLabels } from '../../enums/product.enum';
import { money } from '../../product';
import ProductImage from './ProductImage';
import ProductActions from './ProductActions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';

export default function ProductCard({ product, onChanged }: { product: Product; onChanged?: () => unknown }) {
	const { t, locale } = useText();
	const active = product.productStatus === 'ACTIVE';
	const available = Math.max(0, product.productQuantity - product.productReservedQuantity);
	const quantity = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
	const route = { pathname: '/product/detail', query: { id: product._id } };
	const picture = (
		<div className="quwat-product-image">
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
		<Card
			className="quwat-product-card"
			data-unavailable={!active || undefined}
			data-stock-empty={available <= 0 || undefined}
		>
			{active ? (
				<Link href={route} className="quwat-product-picture">
					{picture}
				</Link>
			) : (
				picture
			)}
			<CardHeader>
				<CardDescription
					className="quwat-product-brand"
					title={product.productBrand || undefined}
					data-empty={!product.productBrand || undefined}
				>
					{product.productBrand || '\u00a0'}
				</CardDescription>
				<CardTitle title={product.productName} role="heading" aria-level={3}>
					{active ? <Link href={route}>{product.productName}</Link> : product.productName}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="quwat-product-price">{money(product.productPrice, locale)}</div>
				<div className="quwat-product-stock">
					<div className="quwat-product-stock-row">
						<span>
							<Inventory2OutlinedIcon aria-hidden="true" />
							{t('Omborda:')}
						</span>
						<strong>
							{quantity.format(product.productQuantity)} {t(unitLabels[product.productUnit])}
						</strong>
					</div>
					{active && product.productReservedQuantity > 0 && (
						<div className="quwat-product-stock-row quwat-product-available">
							<span>{t('Sotuvga mavjud:')}</span>
							<strong>
								{quantity.format(available)} {t(unitLabels[product.productUnit])}
							</strong>
						</div>
					)}
				</div>
			</CardContent>
			<CardFooter>
				{!active && <span className="quwat-product-unavailable">{t('Sotuvda yo‘q')}</span>}
				<ProductActions product={product} onChanged={onChanged} />
			</CardFooter>
		</Card>
	);
}
