import React, { useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	TextField,
} from '@mui/material';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import { DELETE_PRODUCT_PERMANENTLY_BY_ADMIN } from '../../../apollo/admin/product';
import { DELETE_MEMBER_PERMANENTLY_BY_ADMIN } from '../../../apollo/admin/mutation';
import { useText } from '../../i18n';
import { errorText } from '../../feedback';

type Props = {
	kind: 'product' | 'member';
	id: string;
	name: string;
	disabled?: boolean;
	onDeleted: () => Promise<unknown>;
	onBusy?: (busy: boolean) => void;
};
export default function PermanentDeleteButton({ kind, id, name, disabled, onDeleted, onBusy }: Props) {
	const { t, errorMessage } = useText();
	const [open, setOpen] = useState(false);
	const [confirmation, setConfirmation] = useState('');
	const [error, setError] = useState('');
	const [busy, setBusy] = useState(false);
	const locked = useRef(false);
	const product = kind === 'product';
	const [remove] = useMutation(product ? DELETE_PRODUCT_PERMANENTLY_BY_ADMIN : DELETE_MEMBER_PERMANENTLY_BY_ADMIN);
	async function submit() {
		if (locked.current || confirmation !== name) return;
		locked.current = true;
		setBusy(true);
		onBusy?.(true);
		setError('');
		try {
			const result = await remove({ variables: product ? { productId: id } : { memberId: id } });
			if (!result.data?.[product ? 'deleteProductPermanentlyByAdmin' : 'deleteMemberPermanentlyByAdmin'])
				throw new Error('Amal bajarilmadi. Qayta urinib ko‘ring.');
			setOpen(false);
			setConfirmation('');
			await onDeleted();
		} catch (err) {
			setError(errorText(err));
		} finally {
			locked.current = false;
			setBusy(false);
			onBusy?.(false);
		}
	}
	return (
		<>
			<Button
				variant="outlined"
				color="error"
				startIcon={<DeleteForeverOutlinedIcon />}
				aria-label={t('Butunlay o‘chirish')}
				title={t('Butunlay o‘chirish')}
				disabled={disabled || busy}
				onClick={() => {
					setOpen(true);
					setConfirmation('');
					setError('');
				}}
			>
				<span className="quwat-delete-button-label">{t('Butunlay o‘chirish')}</span>
			</Button>
			{!open && error && <Alert severity="error">{errorMessage(error)}</Alert>}
			<Dialog
				open={open}
				onClose={busy ? undefined : () => setOpen(false)}
				fullWidth
				maxWidth="sm"
				aria-labelledby={`delete-${kind}-${id}`}
				PaperProps={{
					sx: { m: { xs: 2, sm: 4 }, width: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' }, borderRadius: 3 },
				}}
			>
				<DialogTitle id={`delete-${kind}-${id}`}>{t('Butunlay o‘chirish')}</DialogTitle>
				<DialogContent>
					<DialogContentText sx={{ overflowWrap: 'anywhere' }}>
						{t('“{{name}}” butunlay o‘chiriladi. Bu amalni ortga qaytarib bo‘lmaydi.', { name })}
					</DialogContentText>
					<DialogContentText sx={{ mt: 1 }}>
						{t('Savdo va davomat tarixi saqlanadi. Bog‘liq saqlanganlar, like va izohlar o‘chiriladi.')}
					</DialogContentText>
					<TextField
						autoFocus
						fullWidth
						margin="normal"
						label={t('Tasdiqlash')}
						helperText={t('Tasdiqlash uchun nomini aynan kiriting')}
						value={confirmation}
						disabled={busy}
						onChange={(e) => setConfirmation(e.target.value)}
						autoComplete="off"
					/>
					{error && <Alert severity="error">{errorMessage(error)}</Alert>}
				</DialogContent>
				<DialogActions
					sx={{
						p: 2,
						gap: 1,
						flexDirection: { xs: 'column-reverse', sm: 'row' },
						'& > .MuiButton-root': {
							m: '0 !important',
							width: { xs: '100%', sm: 'auto' },
							minHeight: 44,
							textTransform: 'none',
						},
					}}
				>
					<Button disabled={busy} onClick={() => setOpen(false)}>
						{t('Bekor qilish')}
					</Button>
					<Button
						variant="contained"
						color="error"
						disabled={busy || confirmation !== name}
						onClick={() => void submit()}
					>
						{busy ? t('Kutilmoqda…') : t('Butunlay o‘chirish')}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}
