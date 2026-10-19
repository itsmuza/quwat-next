import React from 'react';
import Link from 'next/link';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import HardwareOutlinedIcon from '@mui/icons-material/HardwareOutlined';
import PlumbingOutlinedIcon from '@mui/icons-material/PlumbingOutlined';
import ElectricalServicesOutlinedIcon from '@mui/icons-material/ElectricalServicesOutlined';
import FormatPaintOutlinedIcon from '@mui/icons-material/FormatPaintOutlined';
import DoorFrontOutlinedIcon from '@mui/icons-material/DoorFrontOutlined';
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import { ProductType, productTypeLabels } from '../../enums/product.enum';
import { useText } from '../../i18n';

const categoryIcons = {
	[ProductType.ASBOBLAR]: HandymanOutlinedIcon,
	[ProductType.MAHKAMLASH_BUYUMLARI]: HardwareOutlinedIcon,
	[ProductType.SANTEXNIKA]: PlumbingOutlinedIcon,
	[ProductType.ELEKTR_MOLLARI]: ElectricalServicesOutlinedIcon,
	[ProductType.BOYOQ_VA_YELIMLAR]: FormatPaintOutlinedIcon,
	[ProductType.ESHIK_JIHOZLARI]: DoorFrontOutlinedIcon,
	[ProductType.XOJALIK_BUYUMLARI]: CleaningServicesOutlinedIcon,
};

export default function CategoryLinks() {
	const { t } = useText();
	return (
		<section className="quwat-home-categories" aria-labelledby="home-categories-title">
			<div className="container">
				<h2 id="home-categories-title">{t('Kategoriyalar')}</h2>
				<nav className="quwat-category-links" aria-label={t('Kategoriyalar')}>
					{Object.values(ProductType).map((type) => {
						const Icon = categoryIcons[type];
						return (
							<Link
								passHref
								key={type}
								href={{
									pathname: '/product',
									query: {
										input: JSON.stringify({
											page: 1,
											limit: 18,
											sort: 'createdAt',
											direction: 'DESC',
											search: { typeList: [type] },
										}),
									},
								}}
							>
								<Icon aria-hidden="true" />
								<span>{t(productTypeLabels[type])}</span>
							</Link>
						);
					})}
				</nav>
			</div>
		</section>
	);
}
