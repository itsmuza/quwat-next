import { useText } from '../../i18n';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApolloClient } from '@apollo/client';
import {
	Alert,
	Badge,
	Button,
	Divider,
	IconButton,
	MenuItem,
	Popover,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { cartTotal, cartVar, clientCartOwner, refreshCart } from '../../cart';
import { money } from '../../product';
import { errorText } from '../../feedback';
import { sendCartRequest } from '../../sales';
import { paymentLabels, Sale, SalePaymentMethod } from '../../types/sale';
import { useClientCart } from './CartSession';
import CartItems from './CartItems';
export default function CartMenu() {
	const { t, locale, errorMessage: translateError } = useText();
	const cart = useClientCart();
	const client = useApolloClient();
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);
	const [method, setMethod] = useState<SalePaymentMethod>('CASH');
	const [error, setError] = useState('');
	const [last, setLast] = useState<{ owner: string; sale: Sale } | null>(null);
	useEffect(() => {
		setAnchor(null);
		setLast(null);
		setError('');
	}, [cart.ownerId, cart.isClient]);
	if (!cart.isClient) return null;
	const total = cart.intent?.expectedTotal ?? cartTotal(cart.lines);
	const canSend =
		cart.ready &&
		!cart.submitting &&
		cart.lines.length > 0 &&
		(Boolean(cart.intent) || (!cart.syncing && total !== null));
	async function send() {
		const owner = clientCartOwner();
		setError('');
		try {
			const sale = await sendCartRequest(client, method);
			if (owner === clientCartOwner()) setLast({ owner, sale });
		} catch (error) {
			if (owner === clientCartOwner()) {
				setError(errorText(error));
				if (!cartVar().intent) void refreshCart(client);
			}
		}
	}
	return (
		<>
			<IconButton
				className="quwat-navbar-cart"
				aria-label={t('Savatcha: {{count}} ta mahsulot', { count: cart.lines.length })}
				aria-haspopup="dialog"
				aria-expanded={Boolean(anchor)}
				onClick={(event) => {
					setAnchor(event.currentTarget);
					void refreshCart(client);
				}}
			>
				<Badge badgeContent={cart.lines.length} color="error">
					<ShoppingCartOutlinedIcon />
				</Badge>
			</IconButton>
			<Popover
				open={Boolean(anchor)}
				anchorEl={anchor}
				onClose={() => setAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				PaperProps={{
					role: 'dialog',
					'aria-labelledby': 'cart-menu-title',
					sx: { width: 440, maxWidth: 'calc(100vw - 32px)', p: { xs: 2, sm: 3 }, mt: 1, borderRadius: 2 },
				}}
			>
				<Stack spacing={2}>
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography id="cart-menu-title" variant="h6">
							{t('Savatcha')}
						</Typography>
						<IconButton size="small" aria-label={t('Savatchani yopish')} onClick={() => setAnchor(null)}>
							<CloseIcon />
						</IconButton>
					</Stack>
					{last?.owner === cart.ownerId && (
						<Alert severity="success">
							{last.sale.saleStatus === 'COMPLETED'
								? t('To‘lov tasdiqlangan.')
								: t('So‘rov agentlarga yuborildi. Tasdiq kutilmoqda.')}
						</Alert>
					)}
					{error && <Alert severity="error">{translateError(error)}</Alert>}
					{cart.intent && !cart.submitting && (
						<Alert severity="info">
							{t('Avvalgi so‘rov javobi olinmagan. Qayta yuborish yangi so‘rov yaratmaydi.')}
						</Alert>
					)}
					<div
						className="quwat-cart-list"
						style={{ maxHeight: 'min(380px, 45vh)', overflowY: 'auto', paddingRight: 4 }}
					>
						<CartItems />
					</div>
					<Divider />
					<Stack direction="row" justifyContent="space-between" gap={2}>
						<Typography fontWeight={600}>{t('Jami')}</Typography>
						<Typography fontWeight={700}>
							{total === null ? t('Miqdorlarni tekshiring') : money(total, locale)}
						</Typography>
					</Stack>
					{cart.lines.length > 0 && (
						<TextField
							select
							size="small"
							label={t('To‘lov turi')}
							InputLabelProps={{ shrink: true }}
							value={cart.intent?.paymentMethod || method}
							disabled={cart.submitting || Boolean(cart.intent)}
							onChange={(event) => setMethod(event.target.value as SalePaymentMethod)}
						>
							{(['CASH', 'CARD'] as const).map((value) => (
								<MenuItem key={value} value={value}>
									{t(paymentLabels[value])}
								</MenuItem>
							))}
						</TextField>
					)}
					<Button variant="contained" disabled={!canSend} onClick={() => void send()}>
						{cart.submitting ? t('Yuborilmoqda…') : cart.intent ? t('So‘rovni qayta yuborish') : t('To‘lov qilish')}
					</Button>
					<Button component={Link} href="/mypage?category=orders" onClick={() => setAnchor(null)}>
						{t('Mening xaridlarim')}
					</Button>
				</Stack>
			</Popover>
		</>
	);
}
