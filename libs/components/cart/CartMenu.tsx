import { useText } from '../../i18n';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import HomeNavigation from '../homepage/HomeNavigation';
import { useApolloClient } from '@apollo/client';
import {
	Alert,
	Badge,
	Button,
	Drawer,
	IconButton,
	Stack,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from '@mui/material';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import CloseIcon from '@mui/icons-material/Close';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import { useReducedMotion } from 'framer-motion';
import { cartTotal, cartVar, clearCart, clientCartOwner, refreshCart } from '../../cart';
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
	const router = useRouter();
	const searchAfterClose = useRef(false);
	const [open, setOpen] = useState(false);
	const reducedMotion = useReducedMotion();
	const [method, setMethod] = useState<SalePaymentMethod>('CASH');
	const [error, setError] = useState('');
	const [last, setLast] = useState<{ owner: string; sale: Sale } | null>(null);
	useEffect(() => {
		setOpen(false);
		searchAfterClose.current = false;
		setLast(null);
		setError('');
		setMethod('CASH');
	}, [cart.ownerId, cart.isClient]);
	if (!cart.isClient) return null;
	const total = cart.intent?.expectedTotal ?? cartTotal(cart.lines);
	const totalLabel =
		total === null ? t('Miqdorlarni tekshiring') : money(total, locale).replace(/[\u00a0\u202f]/g, ' ');
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
				aria-expanded={open}
				aria-controls={open ? 'quwat-cart-panel' : undefined}
				onClick={() => {
					setOpen(true);
					void refreshCart(client);
				}}
			>
				<Badge badgeContent={cart.lines.length} color="error">
					<ShoppingCartOutlinedIcon />
				</Badge>
			</IconButton>
			<Drawer
				className="quwat-cart-drawer"
				variant="temporary"
				anchor="right"
				open={open}
				onClose={() => setOpen(false)}
				transitionDuration={reducedMotion ? 0 : { enter: 280, exit: 220 }}
				SlideProps={{
					onExited: () => {
						if (!searchAfterClose.current) return;
						searchAfterClose.current = false;
						void router.push('/product').then(() =>
							window.requestAnimationFrame(() => {
								document.getElementById('catalog-mobile-search')?.focus();
								window.scrollTo({ top: 0, behavior: 'auto' });
							}),
						);
					},
				}}
				ModalProps={{
					BackdropProps: {
						className: 'quwat-cart-backdrop',
						transitionDuration: reducedMotion ? 0 : { enter: 280, exit: 220 },
					},
				}}
				PaperProps={{
					id: 'quwat-cart-panel',
					className: 'quwat-cart-panel',
					role: 'dialog',
					'aria-modal': true,
					'aria-labelledby': 'cart-menu-title',
				}}
			>
				<div className="quwat-cart-brandbar">
					<Link passHref href="/" onClick={() => setOpen(false)}>
						<Image src="/img/logo/logoText.svg" width={24} height={24} alt="" />
						<strong>Quwat</strong>
					</Link>
					<span>{t('Qurilish materiallari do‘koni')}</span>
				</div>
				<header className="quwat-cart-header">
					<div className="quwat-cart-title">
						<ShoppingCartOutlinedIcon aria-hidden="true" />
						<Typography id="cart-menu-title" variant="h6" component="h2">
							{t('Savatcha')}
						</Typography>
						<Typography className="quwat-cart-count" variant="body2" color="text.secondary">
							{t('{{count}} ta mahsulot', { count: cart.lines.length })}
						</Typography>
					</div>
					<div className="quwat-cart-header-actions">
						<Button
							className="quwat-cart-clear"
							variant="outlined"
							startIcon={<DeleteSweepOutlinedIcon />}
							aria-label={t('Savatchani tozalash')}
							disabled={!cart.ready || !cart.lines.length || cart.submitting || Boolean(cart.intent)}
							onClick={() => {
								clearCart();
								setError('');
							}}
						>
							{t('Tozalash')}
						</Button>
						<IconButton autoFocus aria-label={t('Savatchani yopish')} onClick={() => setOpen(false)}>
							<CloseIcon />
						</IconButton>
					</div>
				</header>
				<div id="quwat-cart-body" className="quwat-cart-body">
					<Stack spacing={2}>
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
						<CartItems />
					</Stack>
					{cart.lines.length > 0 ? (
						<>
							<section className="quwat-cart-payment-section" aria-labelledby="cart-payment-title">
								<h3 id="cart-payment-title">
									<PaymentsOutlinedIcon aria-hidden="true" />
									{t('To‘lov turi')}
								</h3>
								{cart.lines.length > 0 && (
									<ToggleButtonGroup
										className="quwat-cart-methods"
										exclusive
										aria-label={t('To‘lov turi')}
										value={cart.intent?.paymentMethod || method}
										disabled={cart.submitting || Boolean(cart.intent)}
										onChange={(_, value: SalePaymentMethod | null) => {
											if (value) setMethod(value);
										}}
									>
										{(['CASH', 'CARD'] as const).map((value) => (
											<ToggleButton key={value} value={value} aria-label={t(paymentLabels[value])}>
												{value === 'CASH' ? <PaymentsOutlinedIcon /> : <CreditCardOutlinedIcon />}
												<span>{t(paymentLabels[value])}</span>
											</ToggleButton>
										))}
									</ToggleButtonGroup>
								)}
							</section>
							<section className="quwat-cart-order-summary" aria-labelledby="cart-summary-title">
								<h3 id="cart-summary-title">{t('Buyurtma hisobi')}</h3>
								<div>
									<span>{t('{{count}} ta mahsulot', { count: cart.lines.length })}</span>
									<strong>{totalLabel}</strong>
								</div>
							</section>
						</>
					) : (
						cart.ready && (
							<Button
								className="quwat-cart-continue"
								component={Link}
								href="/product"
								onClick={() => setOpen(false)}
								variant="contained"
							>
								{t('Katalogni ko‘rish →')}
							</Button>
						)
					)}
				</div>
				<footer className="quwat-cart-footer">
					<div className="quwat-cart-total">
						<Typography fontWeight={600}>{t('Jami')}</Typography>
						<Typography className="quwat-cart-total-amount" fontWeight={700}>
							{totalLabel}
						</Typography>
					</div>
					<div className="quwat-cart-footer-actions">
						<Button
							className="quwat-cart-orders"
							variant="outlined"
							fullWidth
							component={Link}
							href="/mypage?category=orders"
							onClick={() => setOpen(false)}
						>
							{t('Mening xaridlarim')}
						</Button>
						<Button
							className="quwat-cart-payment"
							fullWidth
							variant="contained"
							disabled={!canSend}
							onClick={() => void send()}
						>
							{cart.submitting ? t('Yuborilmoqda…') : cart.intent ? t('So‘rovni qayta yuborish') : t('To‘lov qilish')}
						</Button>
					</div>
				</footer>
				<div className="quwat-cart-mobile-navigation">
					<HomeNavigation
						cart
						onNavigate={() => setOpen(false)}
						onSearch={() => {
							searchAfterClose.current = true;
							setOpen(false);
						}}
					/>
				</div>
			</Drawer>
		</>
	);
}
