import { useText } from '../../i18n';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { GET_SALE_FOR_AGENT, REJECT_SALE } from '../../../apollo/user/notifications';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	MenuItem,
	Pagination,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { APPROVE_SALE, CANCEL_SALE, GET_MY_SALES, GET_PENDING_SALES } from '../../../apollo/user/sale';
import { Sale, Sales, saleStatusLabels } from '../../types/sale';
import { activeQueryNames } from '../../activeQueries';
import { errorText } from '../../feedback';
import { money, totalOf } from '../../product';
import QueryState from '../common/QueryState';
import SaleCards from './SaleCards';
import { cartVar, clientCartOwner, failCartRequest } from '../../cart';

function TemporaryInfo({ children }: { children: React.ReactNode }) {
	const [visible, setVisible] = useState(true);
	useEffect(() => {
		const timer = window.setTimeout(() => setVisible(false), 3000);
		return () => window.clearTimeout(timer);
	}, []);
	return visible ? <Alert severity="info">{children}</Alert> : null;
}

export default function SalesPanel({ kind }: { kind: 'client' | 'agent' }) {
	const { t, locale, errorMessage: translateError } = useText();
	const client = useApolloClient();
	const router = useRouter();
	const agent = kind === 'agent';
	const saleId =
		typeof router.query.saleId === 'string' && /^[a-f\d]{24}$/i.test(router.query.saleId) ? router.query.saleId : '';
	const [reject, setReject] = useState(false);
	const pageSize = agent ? 20 : 10;
	const [page, setPage] = useState(1),
		[status, setStatus] = useState('');
	const [selected, setSelected] = useState<Sale | null>(null),
		[busy, setBusy] = useState(false),
		[errorMessage, setError] = useState(''),
		[success, setSuccess] = useState('');
	useEffect(() => {
		if (!success) return;
		const timer = window.setTimeout(() => setSuccess(''), 3000);
		return () => window.clearTimeout(timer);
	}, [success]);
	const input = { page, limit: pageSize, ...(!agent && status ? { saleStatus: status } : {}) };
	const { data, loading, error, refetch } = useQuery<{ getMySales?: Sales; getPendingSales?: Sales }>(
		agent ? GET_PENDING_SALES : GET_MY_SALES,
		{ variables: { input }, fetchPolicy: 'network-only', skip: agent && Boolean(saleId) },
	);
	const [perform] = useMutation<{ approveSale?: Sale; cancelSale?: Sale }>(agent ? APPROVE_SALE : CANCEL_SALE);
	const [performReject] = useMutation(REJECT_SALE);
	const focused = useQuery<{ getSaleForAgent: Sale }>(GET_SALE_FOR_AGENT, {
		variables: { input: { _id: saleId } },
		skip: !agent || !saleId,
		fetchPolicy: 'network-only',
	});
	const rows = agent ? data?.getPendingSales : data?.getMySales;
	async function submit() {
		if (!selected || busy) return;
		setBusy(true);
		setError('');
		setSuccess('');
		try {
			await (agent && reject ? performReject : perform)({ variables: { input: { _id: selected._id } } });
			if (!agent && selected.clientId === clientCartOwner() && cartVar().intent?.requestKey === selected.requestKey)
				failCartRequest(true);
			setSelected(null);
			setSuccess(
				agent && reject
					? t('So‘rov rad etildi. Mahsulotlar bandligi bo‘shatildi.')
					: agent
					? t('To‘lov tasdiqlandi va savdo saqlandi.')
					: t('So‘rov bekor qilindi. Mahsulotlar bandligi bo‘shatildi.'),
			);
			await client.refetchQueries({
				include: activeQueryNames(client, [
					'GetMySales',
					'GetSaleNotifications',
					'GetSaleForAgent',
					'GetPendingSales',
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
			setError(errorText(error));
		} finally {
			setBusy(false);
		}
	}
	return (
		<Stack spacing={3}>
			<Typography variant="h4">{agent ? t('To‘lov so‘rovlari') : t('Xaridlarim')}</Typography>
			{agent && (
				<TemporaryInfo>
					{t('Mijozning naqd yoki karta to‘lovi olinganini tekshirib, so‘rovni tasdiqlang.')}
				</TemporaryInfo>
			)}
			<Stack direction="row" gap={2} flexWrap="wrap">
				{!agent && (
					<TextField
						select
						label={t('Status')}
						value={status}
						onChange={(event) => {
							setStatus(event.target.value);
							setPage(1);
						}}
						sx={{ minWidth: 230 }}
					>
						<MenuItem value="">{t('Barchasi')}</MenuItem>
						{Object.entries(saleStatusLabels).map(([value, label]) => (
							<MenuItem key={value} value={value}>
								{t(label)}
							</MenuItem>
						))}
					</TextField>
				)}
				<Button
					disabled={busy || loading || focused.loading}
					onClick={() => void (agent && saleId ? focused.refetch() : refetch())}
				>
					{t('Yangilash')}
				</Button>
			</Stack>
			{success && <Alert severity="success">{t(success)}</Alert>}
			{errorMessage && !selected && <Alert severity="error">{translateError(errorMessage)}</Alert>}
			<QueryState loading={loading && !data} error={error} retry={() => refetch()} />
			{rows && !rows.list.length && (
				<TemporaryInfo>{agent ? t('Kutilayotgan to‘lov so‘rovlari yo‘q.') : t('Xarid so‘rovlari yo‘q.')}</TemporaryInfo>
			)}
			{agent && saleId && (
				<>
					<Button component={Link} href="/mypage?category=payments" variant="outlined">
						{t('Barcha to‘lov so‘rovlari')}
					</Button>
					<QueryState loading={focused.loading} error={focused.error} retry={() => focused.refetch()} />
					{focused.data?.getSaleForAgent && (
						<SaleCards
							sales={[focused.data.getSaleForAgent]}
							action={(sale) => {
								setError('');
								setReject(false);
								setSelected(sale);
							}}
							onReject={(sale) => {
								setError('');
								setReject(true);
								setSelected(sale);
							}}
							actionLabel="To‘lovni tasdiqlash"
							busy={busy}
						/>
					)}
				</>
			)}
			{rows && !(agent && saleId) && (
				<SaleCards
					sales={rows.list}
					action={(sale) => {
						setError('');
						setSelected(sale);
						setReject(false);
					}}
					actionLabel={agent ? 'To‘lovni tasdiqlash' : 'Bekor qilish'}
					onReject={
						agent
							? (sale) => {
									setError('');
									setReject(true);
									setSelected(sale);
							  }
							: undefined
					}
					busy={busy}
				/>
			)}
			{!(agent && saleId) && (
				<Pagination
					page={page}
					count={Math.max(1, Math.ceil(totalOf(rows) / pageSize))}
					onChange={(_, value) => setPage(value)}
				/>
			)}
			<Dialog
				open={Boolean(selected)}
				onClose={busy ? undefined : () => setSelected(null)}
				fullWidth
				maxWidth="sm"
				aria-labelledby="sale-action-title"
			>
				<DialogTitle id="sale-action-title">
					{agent && reject ? t('So‘rovni rad etish') : agent ? t('To‘lovni tasdiqlash') : t('So‘rovni bekor qilish')}
				</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{selected &&
							`${selected.clientName} — ${money(selected.totalAmount, locale)}. ${
								agent && reject
									? t('So‘rov rad etilib, mahsulotlar bandligi bo‘shatilsinmi?')
									: agent
									? t('To‘lov olinganini tasdiqlaysizmi?')
									: t('Mahsulotlar bandligi bo‘shatiladi. So‘rov bekor qilinsinmi?')
							}`}
					</DialogContentText>
					{errorMessage && (
						<Alert severity="error" sx={{ mt: 2 }}>
							{translateError(errorMessage)}
						</Alert>
					)}
				</DialogContent>
				<DialogActions>
					<Button disabled={busy} onClick={() => setSelected(null)}>
						{t('Ortga')}
					</Button>
					<Button
						variant="contained"
						color={agent && !reject ? 'success' : 'error'}
						disabled={busy}
						sx={{ color: '#fff' }}
						onClick={() => void submit()}
					>
						{agent && reject ? t('Rad etish') : agent ? t('Tasdiqlash') : t('Bekor qilish')}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
}
