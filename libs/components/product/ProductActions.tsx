import { useText } from '../../i18n';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import React, { useEffect, useState } from 'react';
import { useApolloClient, useMutation, useReactiveVar } from '@apollo/client';
import { Alert, IconButton, Portal, Snackbar, Typography, Stack } from '@mui/material';
import { userVar, sessionVar } from '../../../apollo/store';
import { Product } from '../../types/product/product';
import { LIKE_TARGET_PRODUCT, SAVE_PRODUCT, UNSAVE_PRODUCT } from '../../../apollo/user/product';
import { errorText } from '../../feedback';
import { activeQueryNames } from '../../activeQueries';
import { addToCart } from '../../cart';
import { useClientCart } from '../cart/CartSession';
export default function ProductActions({ product, onChanged }: { product: Product; onChanged?: () => unknown }) {
	const { t, errorMessage: translateError } = useText();
	const client = useApolloClient();
	const user = useReactiveVar(userVar);
	const session = useReactiveVar(sessionVar);
	const cart = useClientCart();
	const [notice, setNotice] = useState({ message: '', id: 0 });
	const showError = (message: string) => setNotice((previous) => ({ message, id: previous.id + 1 }));
	const clearError = () => setNotice((previous) => ({ ...previous, message: '' }));
	useEffect(() => {
		if (!notice.message) return;
		const timer = window.setTimeout(() => setNotice((previous) => ({ ...previous, message: '' })), 1000);
		return () => window.clearTimeout(timer);
	}, [notice.id, notice.message]);
	const [busy, setBusy] = useState(false);
	const [like] = useMutation<{ likeTargetProduct: Product }, { productId: string }>(LIKE_TARGET_PRODUCT);
	const [save] = useMutation<{ saveProduct: boolean }, { productId: string }>(SAVE_PRODUCT);
	const [unsave] = useMutation<{ unsaveProduct: boolean }, { productId: string }>(UNSAVE_PRODUCT);
	const active = product.productStatus === 'ACTIVE';
	const liked = Boolean(product.meLiked?.some((item) => item.myFavorite));
	async function act(bookmark: boolean) {
		if (session.status !== 'authenticated' || !user._id) {
			showError('Davom etish uchun tizimga kiring.');
			return;
		}
		setBusy(true);
		clearError();
		try {
			if (bookmark) {
				const mutation = product.meSaved ? unsave : save;
				await mutation({
					variables: { productId: product._id },
					update(cache) {
						cache.modify({
							id: cache.identify({ __typename: 'Product', _id: product._id }),
							fields: { meSaved: () => !product.meSaved },
						});
					},
					refetchQueries: () =>
						activeQueryNames(client, ['GetProduct', 'GetProducts', 'GetSavedProducts', 'GetFavorites', 'GetVisited']),
					awaitRefetchQueries: true,
				});
			} else
				await like({
					variables: { productId: product._id },
					refetchQueries: () => activeQueryNames(client, ['GetFavorites']),
					awaitRefetchQueries: true,
				});
			await onChanged?.();
		} catch (error) {
			showError(errorText(error));
		} finally {
			setBusy(false);
		}
	}
	return (
		<Stack spacing={1} sx={{ width: '100%' }}>
			<Stack
				direction="row"
				alignItems="center"
				flexWrap="wrap"
				gap={1}
				className="view-like-box"
				sx={{ width: '100%' }}
			>
				{active && (
					<>
						<IconButton
							size="small"
							disabled={busy}
							onClick={() => void act(false)}
							aria-label={t('Yoqtirish')}
							aria-pressed={liked}
						>
							{liked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
						</IconButton>
						<Typography variant="caption" className="view-cnt">
							{product.productLikes}
						</Typography>
					</>
				)}
				{session.status === 'authenticated' && user.memberType === 'CLIENT' && (active || product.meSaved) && (
					<IconButton
						size="small"
						disabled={busy}
						onClick={() => void act(true)}
						title={product.meSaved ? t('Saqlanganlardan olib tashlash') : t('Mahsulotni saqlash')}
						sx={{ color: product.meSaved ? '#000' : undefined }}
						aria-label={product.meSaved ? t('Saqlangandan olish') : t('Saqlash')}
						aria-pressed={product.meSaved}
					>
						{product.meSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
					</IconButton>
				)}
				{active && cart.isClient && (
					<IconButton
						className="quwat-cart-add"
						size="small"
						aria-label={t('Savatchaga qo‘shish')}
						title={t('Savatchaga qo‘shish')}
						disabled={!cart.ready || busy || cart.submitting || Boolean(cart.intent)}
						onClick={() => {
							const error = addToCart(product);
							if (error) showError(error);
							else clearError();
						}}
					>
						<AddShoppingCartIcon />
					</IconButton>
				)}
			</Stack>
			<Portal>
				<Snackbar
					key={notice.id}
					open={Boolean(notice.message)}
					anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
					onClose={(_, reason) => {
						if (reason !== 'clickaway') clearError();
					}}
					sx={{
						top: '50% !important',
						left: '50% !important',
						transform: 'translate(-50%, -50%) !important',
						width: 'max-content',
						maxWidth: 'calc(100vw - 32px)',
					}}
				>
					<Alert severity="error" variant="filled" sx={{ width: '100%', maxWidth: 460, boxShadow: 6 }}>
						{translateError(notice.message)}
					</Alert>
				</Snackbar>
			</Portal>
		</Stack>
	);
}
