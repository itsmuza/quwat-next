import { useText } from '../../i18n';
import React from 'react';
import Link from 'next/link';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { Product } from '../../types/product/product';
import { productTypeLabels, unitLabels } from '../../enums/product.enum';
import { money } from '../../product';
import ProductImage from './ProductImage';
import ProductActions from './ProductActions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';

export default function ProductCard({
	product,
	onChanged,
	compact = false,
}: {
	product: Product;
	onChanged?: () => unknown;
	compact?: boolean;
}) {
	const { t, locale } = useText();
	const active = product.productStatus === 'ACTIVE';
	const available = Math.max(0, product.productQuantity - product.productReservedQuantity);
	const quantity = new Intl.NumberFormat(locale, { maximumFractionDigits: 3 });
	const unit = t(unitLabels[product.productUnit]);
	const description = product.productDesc?.trim();
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
			className={`quwat-product-card${compact ? ' quwat-home-product' : ''}`}
			data-unavailable={!active || undefined}
			data-stock-empty={available <= 0 || undefined}
		>
			{compact && (
				<div className="quwat-home-product-brand" title={product.productBrand || undefined}>
					{product.productBrand || t('Mahsulotlar')}
				</div>
			)}
			{active ? (
				<Link href={route} className="quwat-product-picture">
					{picture}
				</Link>
			) : (
				picture
			)}
			<CardHeader>
				{compact && (
					<span className={`quwat-home-stock-badge${available <= 0 ? ' empty' : ''}`}>
						{t(available > 0 ? 'Omborda bor' : 'Sotuvda yo‘q')}
					</span>
				)}
				<CardDescription
					className="quwat-product-brand"
					title={product.productBrand || undefined}
					data-empty={!product.productBrand || undefined}
				>
					{product.productBrand || '\u00a0'}
				</CardDescription>
				<div className="quwat-product-category">{t(productTypeLabels[product.productType])}</div>
				<CardTitle title={product.productName} role="heading" aria-level={3}>
					{active ? <Link href={route}>{product.productName}</Link> : product.productName}
				</CardTitle>
				{description && (
					<p className="quwat-product-description" title={description}>
						{description}
					</p>
				)}
				<dl className="quwat-product-specs">
					<div>
						<dt>{t('Minimal miqdor')}</dt>
						<dd>
							{quantity.format(product.productMinOrderQuantity)} {unit}
						</dd>
					</div>
					<div>
						<dt>{t('Miqdor qadami')}</dt>
						<dd>
							{quantity.format(product.productQuantityStep)} {unit}
						</dd>
					</div>
				</dl>
			</CardHeader>
			<CardContent>
				<div className="quwat-product-price">{money(product.productPrice, locale)}</div>
				<div className="quwat-product-price-unit">{t('1 {{unit}} uchun', { unit })}</div>
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
				<ProductActions product={product} onChanged={onChanged} showCartLabel={compact} />
			</CardFooter>
		</Card>
	);
}
