import { useText } from '../../i18n';
import React, { useState } from 'react';
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
export default function SalesPanel({ kind }: { kind: 'client' | 'agent' }) {
	const { t, locale, errorMessage: translateError } = useText();
	const client = useApolloClient();
	const agent = kind === 'agent';
	const [page, setPage] = useState(1),
		[status, setStatus] = useState('');
	const [selected, setSelected] = useState<Sale | null>(null),
		[busy, setBusy] = useState(false),
		[errorMessage, setError] = useState(''),
		[success, setSuccess] = useState('');
	const input = { page, limit: 20, ...(!agent && status ? { saleStatus: status } : {}) };
	const { data, loading, error, refetch } = useQuery<{ getMySales?: Sales; getPendingSales?: Sales }>(
		agent ? GET_PENDING_SALES : GET_MY_SALES,
		{ variables: { input }, fetchPolicy: 'network-only' },
	);
	const [perform] = useMutation<{ approveSale?: Sale; cancelSale?: Sale }>(agent ? APPROVE_SALE : CANCEL_SALE);
	const rows = agent ? data?.getPendingSales : data?.getMySales;
	async function submit() {
		if (!selected || busy) return;
		setBusy(true);
		setError('');
		setSuccess('');
		try {
			await perform({ variables: { input: { _id: selected._id } } });
			if (!agent && selected.clientId === clientCartOwner() && cartVar().intent?.requestKey === selected.requestKey)
				failCartRequest(true);
			setSelected(null);
			setSuccess(
				agent
					? t('To‘lov tasdiqlandi va savdo saqlandi.')
					: t('So‘rov bekor qilindi. Mahsulotlar bandligi bo‘shatildi.'),
			);
			await client.refetchQueries({
				include: activeQueryNames(client, [
					'GetMySales',
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
				<Alert severity="info">
					{t('Mijozning naqd yoki karta to‘lovi olinganini tekshirib, so‘rovni tasdiqlang.')}
				</Alert>
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
				<Button disabled={busy || loading} onClick={() => void refetch()}>
					{t('Yangilash')}
				</Button>
			</Stack>
			{success && <Alert severity="success">{t(success)}</Alert>}
			{errorMessage && !selected && <Alert severity="error">{translateError(errorMessage)}</Alert>}
			<QueryState loading={loading && !data} error={error} retry={() => refetch()} />
			{rows && !rows.list.length && (
				<Alert severity="info">{agent ? t('Kutilayotgan to‘lov so‘rovlari yo‘q.') : t('Xarid so‘rovlari yo‘q.')}</Alert>
			)}
			{rows && (
				<SaleCards
					sales={rows.list}
					action={(sale) => {
						setError('');
						setSelected(sale);
					}}
					actionLabel={agent ? 'To‘lovni tasdiqlash' : 'Bekor qilish'}
					busy={busy}
				/>
			)}
			<Pagination
				page={page}
				count={Math.max(1, Math.ceil(totalOf(rows) / 20))}
				onChange={(_, value) => setPage(value)}
			/>
			<Dialog
				open={Boolean(selected)}
				onClose={busy ? undefined : () => setSelected(null)}
				fullWidth
				maxWidth="sm"
				aria-labelledby="sale-action-title"
			>
				<DialogTitle id="sale-action-title">
					{agent ? t('To‘lovni tasdiqlash') : t('So‘rovni bekor qilish')}
				</DialogTitle>
				<DialogContent>
					<DialogContentText>
						{selected &&
							`${selected.clientName} — ${money(selected.totalAmount, locale)}. ${
								agent
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
						color={agent ? 'success' : 'error'}
						disabled={busy}
						sx={{ color: '#fff' }}
						onClick={() => void submit()}
					>
						{agent ? t('Tasdiqlash') : t('Bekor qilish')}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
}
