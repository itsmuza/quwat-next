import { useText } from '../../i18n';
import React from 'react';
import { Alert, Button, IconButton, Stack, TextField, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useApolloClient } from '@apollo/client';
import {
	calculatedLineAmount,
	lineTotal,
	quantityError,
	refreshCart,
	removeFromCart,
	setCartQuantity,
	stockAvailable,
} from '../../cart';
import { money } from '../../product';
import { unitLabels } from '../../enums/product.enum';
import ProductImage from '../product/ProductImage';
import { useClientCart } from './CartSession';

export default function CartItems() {
	const { t, locale, errorMessage: translateError } = useText();
	const cart = useClientCart();
	const client = useApolloClient();
	const locked = cart.submitting || Boolean(cart.intent);
	if (!cart.ready) return <Typography color="text.secondary">{t('Savatcha yuklanmoqda…')}</Typography>;
	if (!cart.lines.length)
		return <Typography color="text.secondary">{t('Savatcha bo‘sh. Katalogdan mahsulot tanlang.')}</Typography>;
	return (
		<Stack spacing={2}>
			{cart.error && <Alert severity="warning">{translateError(cart.error)}</Alert>}
			{cart.syncing && (
				<Typography role="status" variant="body2" color="text.secondary">
					{t('Narxlar va qoldiq tekshirilmoqda…')}
				</Typography>
			)}
			{cart.lines.map((line) => {
				const sent = cart.intent?.items.find((item) => item.productId === line.productId);
				const p =
					line.product &&
					(sent
						? { ...line.product, productPrice: sent.expectedUnitPrice, productUnit: sent.expectedProductUnit }
						: line.product);
				const name = p?.productName || t('Mahsulot mavjud emas');
				const validation = p && !sent ? quantityError(p, line.quantity) : null;
				const amount = sent ? calculatedLineAmount(sent.expectedUnitPrice, sent.quantity) : lineTotal(line);
				const step = p?.productQuantityStep || 1;
				const adjusted = (direction: number) =>
					String((Math.round(Number(line.quantity) * 1000) + direction * Math.round(step * 1000)) / 1000);
				return (
					<div key={line.productId} className="quwat-cart-item">
						<div className="quwat-cart-picture">
							<ProductImage
								key={p?.productImages[0] || 'empty'}
								path={p?.productImages[0]}
								name={name}
								width={64}
								height={64}
							/>
						</div>
						<div className="quwat-cart-item-details">
							<Stack
								className="quwat-cart-item-heading"
								direction="row"
								justifyContent="space-between"
								alignItems="flex-start"
								gap={1}
							>
								<Typography className="quwat-cart-item-name" fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>
									{p ? name : cart.syncing ? t('Mahsulot yuklanmoqda…') : name}
								</Typography>
								<IconButton
									size="small"
									aria-label={t('{{name}}ni savatchadan olib tashlash', { name })}
									disabled={locked}
									onClick={() => removeFromCart(line.productId)}
								>
									<DeleteOutlineIcon fontSize="small" />
								</IconButton>
							</Stack>
							{p && (
								<Typography className="quwat-cart-unit-price" variant="body2" color="text.secondary">
									{money(p.productPrice, locale)} / {t(unitLabels[p.productUnit])}
								</Typography>
							)}
						</div>
						{p && (
							<div className="quwat-cart-item-purchase">
								<Stack className="quwat-cart-quantity" direction="row" gap={0.5} alignItems="center">
									<IconButton
										size="small"
										aria-label={t('{{name}} miqdorini kamaytirish', { name })}
										disabled={locked || cart.syncing || Boolean(validation) || Boolean(quantityError(p, adjusted(-1)))}
										onClick={() => setCartQuantity(line.productId, adjusted(-1))}
									>
										<RemoveIcon fontSize="small" />
									</IconButton>
									<TextField
										size="small"
										type="number"
										label={t('Miqdor')}
										InputLabelProps={{ shrink: true }}
										value={line.quantity}
										onChange={(e) => setCartQuantity(line.productId, e.target.value)}
										disabled={locked || cart.syncing}
										inputProps={{
											min: p.productMinOrderQuantity,
											max: stockAvailable(p),
											step,
											'aria-label': t('{{name}} miqdori', { name }),
										}}
										sx={{ width: 64, minWidth: 0 }}
									/>
									<IconButton
										size="small"
										aria-label={t('{{name}} miqdorini oshirish', { name })}
										disabled={locked || cart.syncing || Boolean(validation) || Boolean(quantityError(p, adjusted(1)))}
										onClick={() => setCartQuantity(line.productId, adjusted(1))}
									>
										<AddIcon fontSize="small" />
									</IconButton>
								</Stack>
								<Typography className="quwat-cart-line-total" variant="body2" sx={{ overflowWrap: 'anywhere' }}>
									{line.quantity || '—'} {t(unitLabels[p.productUnit])} × {money(p.productPrice, locale)} ={' '}
									<strong>{amount === null ? '—' : money(amount, locale)}</strong>
								</Typography>
							</div>
						)}
						{(line.error || validation || (p && amount === null)) && (
							<Alert severity="warning" sx={{ py: 0 }}>
								{translateError(line.error || validation || 'Hisob qiymati juda katta. Miqdorni kamaytiring.')}
							</Alert>
						)}
						{line.error && (
							<Button size="small" disabled={cart.syncing} onClick={() => void refreshCart(client)}>
								{t('Qayta tekshirish')}
							</Button>
						)}
					</div>
				);
			})}
		</Stack>
	);
}
