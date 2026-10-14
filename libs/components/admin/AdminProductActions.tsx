import { useText } from '../../i18n';
import React, { useState } from 'react';
import { useApolloClient, useMutation, useReactiveVar } from '@apollo/client';
import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Stack,
} from '@mui/material';
import { REMOVE_PRODUCT_BY_ADMIN, UPDATE_PRODUCT } from '../../../apollo/admin/product';
import { sessionVar, userVar } from '../../../apollo/store';
import { invalidateProductCatalog } from '../../adminProduct';
import { ProductStatus } from '../../enums/product.enum';
import { errorText } from '../../feedback';
import { Product, ProductUpdate } from '../../types/product/product';
import ProductForm from './ProductForm';

export default function AdminProductActions({
	product,
	onChanged,
}: {
	product: Product;
	onChanged: () => Promise<unknown>;
}) {
	const { t, errorMessage: translateError } = useText();
	const client = useApolloClient();
	const session = useReactiveVar(sessionVar);
	const user = useReactiveVar(userVar);
	const [editing, setEditing] = useState(false);
	const [busy, setBusy] = useState(false);
	const [pendingStatus, setPendingStatus] = useState<ProductStatus | null>(null);
	const [error, setError] = useState('');
	const [archive] = useMutation<{ removeProductByAdmin: Product }, { productId: string }>(REMOVE_PRODUCT_BY_ADMIN);
	const [update] = useMutation<{ updateProduct: Product }, { input: ProductUpdate }>(UPDATE_PRODUCT);
	if (session.status !== 'authenticated' || user.memberType !== 'ADMIN') return null;
	async function refresh() {
		invalidateProductCatalog(client, product._id);
		await onChanged();
	}
	async function changeStatus(status: ProductStatus) {
		setBusy(true);
		setError('');
		try {
			if (status === ProductStatus.ARCHIVED) await archive({ variables: { productId: product._id } });
			else await update({ variables: { input: { _id: product._id, productStatus: status } } });
			setPendingStatus(null);
			await refresh();
		} catch (error) {
			setError(errorText(error));
		} finally {
			setBusy(false);
		}
	}
	return (
		<Stack spacing={2}>
			{error && pendingStatus === null && <Alert severity="error">{translateError(error)}</Alert>}
			<Stack direction="row" gap={1} flexWrap="wrap" aria-label={t('Admin mahsulot boshqaruvi')}>
				<Button variant="outlined" disabled={busy} onClick={() => setEditing(true)}>
					{t('Tahrirlash')}
				</Button>
				{product.productStatus !== ProductStatus.ARCHIVED && (
					<Button
						variant="outlined"
						color="error"
						disabled={busy}
						onClick={() => setPendingStatus(ProductStatus.ARCHIVED)}
					>
						{t('Arxivlash')}
					</Button>
				)}
				{product.productStatus !== ProductStatus.ACTIVE && (
					<Button
						variant="contained"
						color="success"
						disabled={busy}
						onClick={() => setPendingStatus(ProductStatus.ACTIVE)}
					>
						{product.productStatus === ProductStatus.ARCHIVED ? t('Arxivdan chiqarish') : t('Sotuvga chiqarish')}
					</Button>
				)}
			</Stack>
			{editing && <ProductForm product={product} close={() => setEditing(false)} saved={refresh} />}
			<Dialog
				open={pendingStatus !== null}
				onClose={busy ? undefined : () => setPendingStatus(null)}
				aria-labelledby="product-status-title"
			>
				<DialogTitle id="product-status-title">
					{pendingStatus === ProductStatus.ARCHIVED
						? t('Mahsulotni arxivlash')
						: product.productStatus === ProductStatus.ARCHIVED
						? t('Mahsulotni arxivdan chiqarish')
						: t('Mahsulotni sotuvga chiqarish')}
				</DialogTitle>
				<DialogContent>
					{error && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{translateError(error)}
						</Alert>
					)}
					<DialogContentText>
						{product.productName}:{' '}
						{pendingStatus === ProductStatus.ARCHIVED
							? t('arxivlangach, mahsulot ochiq katalogda ko‘rinmaydi.')
							: t('mahsulot sotuvdagi holatga o‘tadi va ochiq katalogda ko‘rinadi.')}
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button disabled={busy} onClick={() => setPendingStatus(null)}>
						{t('Bekor qilish')}
					</Button>
					<Button
						variant="contained"
						color={pendingStatus === ProductStatus.ARCHIVED ? 'error' : 'success'}
						disabled={busy}
						onClick={() => pendingStatus && void changeStatus(pendingStatus)}
					>
						{t('Tasdiqlash')}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
}
