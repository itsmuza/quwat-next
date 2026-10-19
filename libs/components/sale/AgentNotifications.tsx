import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useApolloClient, useReactiveVar } from '@apollo/client';
import {
	Alert,
	Badge,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Drawer,
	IconButton,
	Snackbar,
	Stack,
	Typography,
} from '@mui/material';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import { useReducedMotion } from 'framer-motion';
import { sessionVar, userVar } from '../../../apollo/store';
import { APPROVE_SALE } from '../../../apollo/user/sale';
import { GET_SALE_NOTIFICATIONS, MARK_SALE_NOTIFICATION_READ, REJECT_SALE } from '../../../apollo/user/notifications';
import { useText } from '../../i18n';
import { Sale, SaleNotifications, paymentLabels, saleStatusLabels } from '../../types/sale';
import { money } from '../../product';
import { errorText } from '../../feedback';
import { activeQueryNames } from '../../activeQueries';
import QueryState from '../common/QueryState';
import useNotificationFeed from '../notifications/useNotificationFeed';
const saleNotificationKey = (entry: SaleNotifications['list'][number]) => entry.sale._id;

export default function AgentNotifications() {
	const user = useReactiveVar(userVar);
	const session = useReactiveVar(sessionVar);
	if (session.status !== 'authenticated' || user.memberType !== 'AGENT' || user.memberStatus !== 'ACTIVE') return null;
	return <AgentInbox key={user._id} />;
}

function AgentInbox() {
	const { t, locale, errorMessage: translateError } = useText();
	const client = useApolloClient();
	const reducedMotion = useReducedMotion();
	const alive = useRef(true);
	const [open, setOpen] = useState(false);
	const [selected, setSelected] = useState<{ sale: Sale; reject: boolean } | null>(null);
	const [busy, setBusy] = useState(false);
	const [actionError, setActionError] = useState('');
	const [success, setSuccess] = useState('');
	const [toast, setToast] = useState(false);
	const previousUnread = useRef<number | null>(null);
	const {
		source: firstBatch,
		list,
		loading,
		error,
		refresh,
		moreLoading,
		moreError,
	} = useNotificationFeed<SaleNotifications['list'][number]>({
		query: GET_SALE_NOTIFICATIONS,
		field: 'getSaleNotifications',
		keyOf: saleNotificationKey,
		socketEvent: 'saleChanged',
	});
	const inbox = firstBatch && { ...firstBatch, list };
	const unread = firstBatch?.unreadCount || 0;
	useEffect(() => {
		alive.current = true;
		return () => {
			alive.current = false;
		};
	}, []);
	useEffect(() => {
		if (!firstBatch) return;
		if (previousUnread.current !== null && unread > previousUnread.current) setToast(true);
		previousUnread.current = unread;
	}, [firstBatch, unread]);
	async function markRead(saleId: string) {
		try {
			await client.mutate({ mutation: MARK_SALE_NOTIFICATION_READ, variables: { input: { _id: saleId } } });
			if (alive.current) refresh();
		} catch (error) {
			if (alive.current) setActionError(errorText(error));
		}
	}
	async function decide() {
		if (!selected || busy) return;
		setBusy(true);
		setActionError('');
		const choice = selected;
		try {
			await client.mutate({
				mutation: choice.reject ? REJECT_SALE : APPROVE_SALE,
				variables: { input: { _id: choice.sale._id } },
			});
			if (!alive.current) return;
			setSelected(null);
			setSuccess(
				choice.reject
					? 'So‘rov rad etildi. Mahsulotlar bandligi bo‘shatildi.'
					: 'To‘lov tasdiqlandi va savdo saqlandi.',
			);
			await markRead(choice.sale._id);
			await client.refetchQueries({
				include: activeQueryNames(client, [
					'GetSaleNotifications',
					'GetSaleForAgent',
					'GetPendingSales',
					'GetMySales',
					'GetAllSalesByAdmin',
					'GetDailySalesByAdmin',
					'GetProducts',
					'GetProduct',
					'GetSavedProducts',
					'GetFavorites',
					'GetVisited',
				]),
			});
		} catch (error) {
			if (alive.current) {
				setActionError(errorText(error));
				refresh();
			}
		} finally {
			if (alive.current) setBusy(false);
		}
	}
	return (
		<>
			<IconButton
				className="quwat-navbar-notifications"
				aria-label={t('Bildirishnomalar: {{count}} ta o‘qilmagan', { count: unread })}
				aria-haspopup="dialog"
				aria-expanded={open}
				aria-controls={open ? 'quwat-notifications-panel' : undefined}
				onClick={() => {
					setOpen(true);
					setToast(false);
					refresh();
				}}
			>
				<Badge badgeContent={unread} max={99} color="error">
					<NotificationsNoneOutlinedIcon />
				</Badge>
			</IconButton>
			<Drawer
				className="quwat-notifications-drawer"
				anchor="right"
				open={open}
				onClose={busy ? undefined : () => setOpen(false)}
				transitionDuration={reducedMotion ? 0 : { enter: 280, exit: 220 }}
				PaperProps={{
					id: 'quwat-notifications-panel',
					className: 'quwat-notifications-panel',
					role: 'dialog',
					'aria-modal': true,
					'aria-labelledby': 'quwat-notifications-title',
				}}
			>
				<header className="quwat-notifications-header">
					<div>
						<Typography id="quwat-notifications-title" component="h2" variant="h6">
							{t('Bildirishnomalar')}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{t('{{count}} ta o‘qilmagan', { count: unread })}
						</Typography>
					</div>
					<IconButton
						autoFocus
						disabled={busy}
						aria-label={t('Bildirishnomalarni yopish')}
						onClick={() => setOpen(false)}
					>
						<CloseIcon />
					</IconButton>
				</header>
				<div className="quwat-notifications-body">
					<Stack spacing={2}>
						{success && (
							<Alert severity="success" onClose={() => setSuccess('')}>
								{t(success)}
							</Alert>
						)}
						{actionError && !selected && <Alert severity="error">{translateError(actionError)}</Alert>}
						<QueryState loading={loading && !inbox} error={error} retry={refresh} />
						{inbox && !inbox.list.length && <Alert severity="info">{t('Hozircha bildirishnomalar yo‘q.')}</Alert>}
						{inbox?.list.map(({ sale, readAt }) => (
							<article key={sale._id} className={`quwat-sale-notification ${readAt ? '' : 'unread'}`}>
								<div className="quwat-notification-meta">
									<Typography fontWeight={600}>{sale.clientName}</Typography>
									{!readAt && <span className="quwat-unread-dot" aria-label={t('O‘qilmagan')} />}
								</div>
								<Typography variant="body2" color="text.secondary">
									{t('Yangi to‘lov so‘rovi')} #{sale._id.slice(-6).toUpperCase()}
								</Typography>
								<Typography className="quwat-notification-products" variant="body2">
									{sale.items.map((item) => item.productName).join(', ')}
								</Typography>
								<div className="quwat-notification-meta">
									<Typography fontWeight={700}>{money(sale.totalAmount, locale)}</Typography>
									<Chip
										size="small"
										className={sale.saleStatus.toLowerCase()}
										label={t(sale.rejectedAt ? 'Agent rad etdi' : saleStatusLabels[sale.saleStatus])}
									/>
								</div>
								<Typography variant="caption" color="text.secondary">
									{t(paymentLabels[sale.paymentMethod])} ·{' '}
									{new Date(sale.createdAt).toLocaleString(locale, { timeZone: 'Asia/Tashkent' })}
								</Typography>
								<Button
									className="quwat-notification-open"
									component={Link}
									variant="outlined"
									disabled={busy}
									href={`/mypage?category=payments&saleId=${encodeURIComponent(sale._id)}`}
									onClick={() => {
										if (!readAt) void markRead(sale._id);
										setOpen(false);
									}}
								>
									{t('So‘rovni ochish')}
								</Button>
								{sale.saleStatus === 'PENDING' && (
									<div className="quwat-notification-actions">
										<Button
											startIcon={<BlockOutlinedIcon />}
											variant="outlined"
											color="error"
											disabled={busy}
											onClick={() => {
												setActionError('');
												setSelected({ sale, reject: true });
											}}
										>
											{t('Rad etish')}
										</Button>
										<Button
											startIcon={<CheckOutlinedIcon />}
											variant="contained"
											color="success"
											disabled={busy}
											onClick={() => {
												setActionError('');
												setSelected({ sale, reject: false });
											}}
										>
											{t('Tasdiqlash')}
										</Button>
									</div>
								)}
							</article>
						))}
						<QueryState loading={moreLoading} error={moreError} retry={refresh} />
					</Stack>
				</div>
			</Drawer>
			<Dialog
				open={Boolean(selected)}
				onClose={busy ? undefined : () => setSelected(null)}
				fullWidth
				maxWidth="sm"
				aria-labelledby="quwat-notification-decision"
			>
				<DialogTitle id="quwat-notification-decision">
					{t(selected?.reject ? 'So‘rovni rad etish' : 'To‘lovni tasdiqlash')}
				</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{selected &&
							`${selected.sale.clientName} — ${money(selected.sale.totalAmount, locale)}. ${t(
								selected.reject
									? 'So‘rov rad etilib, mahsulotlar bandligi bo‘shatilsinmi?'
									: 'To‘lov olinganini tasdiqlaysizmi?',
							)}`}
					</DialogContentText>
					{actionError && (
						<Alert severity="error" sx={{ mt: 2 }}>
							{translateError(actionError)}
						</Alert>
					)}
				</DialogContent>
				<DialogActions>
					<Button disabled={busy} onClick={() => setSelected(null)}>
						{t('Ortga')}
					</Button>
					<Button
						disabled={busy}
						variant="contained"
						color={selected?.reject ? 'error' : 'success'}
						onClick={() => void decide()}
					>
						{t(selected?.reject ? 'Rad etish' : 'Tasdiqlash')}
					</Button>
				</DialogActions>
			</Dialog>
			<Snackbar
				open={toast && !open}
				autoHideDuration={4000}
				onClose={() => setToast(false)}
				message={t('Yangi to‘lov so‘rovi keldi.')}
			/>
		</>
	);
}
