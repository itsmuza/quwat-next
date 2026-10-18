import { useText } from '../../i18n';
import React from 'react';
import { Button, Chip, Stack, Typography } from '@mui/material';
import { Sale, paymentLabels, saleStatusLabels } from '../../types/sale';
import { unitLabels } from '../../enums/product.enum';
import { money } from '../../product';
import ProductImage from '../product/ProductImage';
const time = (value: string, locale: string) => new Date(value).toLocaleString(locale, { timeZone: 'Asia/Tashkent' });
export default function SaleCards({
	sales,
	action,
	actionLabel,
	onReject,
	busy = false,
	columns = 1,
}: {
	sales: Sale[];
	action?: (sale: Sale) => void;
	actionLabel?: string;
	onReject?: (sale: Sale) => void;
	busy?: boolean;
	columns?: 1 | 2;
}) {
	const { t, locale } = useText();
	return (
		<Stack
			spacing={columns === 2 ? 0 : 2}
			sx={
				columns === 2
					? {
							display: 'grid',
							gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
							gap: 2,
							'& > .quwat-record': { minWidth: 0 },
					  }
					: undefined
			}
		>
			{sales.map((sale) => (
				<Stack className="quwat-record" key={sale._id} spacing={2}>
					<Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1}>
						<Typography variant="h6">
							{t('Xarid #')}
							{sale._id.slice(-6).toUpperCase()}
						</Typography>
						<Chip
							size="small"
							label={t(sale.rejectedAt ? 'Agent rad etdi' : saleStatusLabels[sale.saleStatus])}
							sx={{
								backgroundColor:
									sale.saleStatus === 'COMPLETED' ? '#eaf6ee' : sale.saleStatus === 'PENDING' ? '#fff4df' : '#fceceb',
								color:
									sale.saleStatus === 'COMPLETED' ? '#1e6539' : sale.saleStatus === 'PENDING' ? '#8a4b08' : '#9f2924',
								fontWeight: 600,
							}}
						/>
					</Stack>
					<Typography variant="body2" color="text.secondary">
						{t('Mijoz:')} {sale.clientName} {t('· To‘lov:')} {t(paymentLabels[sale.paymentMethod])} {t('· Yuborilgan:')}{' '}
						{time(sale.createdAt, locale)}
					</Typography>
					{sale.items.map((item) => (
						<div className="quwat-sale-line" key={item.productId}>
							<div className="quwat-cart-picture">
								<ProductImage path={item.productImage || undefined} name={item.productName} width={64} height={64} />
							</div>
							<Stack spacing={0.5} sx={{ minWidth: 0 }}>
								<Typography fontWeight={600} sx={{ overflowWrap: 'anywhere' }}>
									{item.productName}
								</Typography>
								<Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
									{item.quantity} {t(unitLabels[item.productUnit])} × {money(item.unitPrice, locale)} ={' '}
									<strong>{money(item.lineTotal, locale)}</strong>
								</Typography>
							</Stack>
						</div>
					))}
					<Typography fontWeight={700}>
						{t('Jami:')} {money(sale.totalAmount, locale)}
					</Typography>
					{sale.completedAt && (
						<Typography variant="body2" color="text.secondary">
							{t('Tasdiqlangan:')} {time(sale.completedAt, locale)} {t('· Agent:')}{' '}
							{sale.agentName || t('Ko‘rsatilmagan')}
						</Typography>
					)}
					{sale.cancelledAt && (
						<Typography variant="body2" color="text.secondary">
							{t('Bekor qilingan:')} {time(sale.cancelledAt, locale)}
						</Typography>
					)}
					{sale.rejectedAt && (
						<Typography variant="body2" color="text.secondary">
							{t('Agent rad etdi')}: {sale.rejectedByName}
						</Typography>
					)}
					{onReject && sale.saleStatus === 'PENDING' && (
						<Button
							variant="outlined"
							color="error"
							disabled={busy}
							sx={{ alignSelf: 'flex-start' }}
							onClick={() => onReject(sale)}
						>
							{t('Rad etish')}
						</Button>
					)}
					{action && sale.saleStatus === 'PENDING' && (
						<Button
							variant="contained"
							color={actionLabel === 'Bekor qilish' ? 'error' : 'success'}
							disabled={busy}
							sx={{ alignSelf: 'flex-start', color: '#fff' }}
							onClick={() => action(sale)}
						>
							{actionLabel ? t(actionLabel) : ''}
						</Button>
					)}
				</Stack>
			))}
		</Stack>
	);
}
