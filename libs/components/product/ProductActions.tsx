import { useText } from '../../i18n';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import React, { useEffect, useRef, useState } from 'react';
import { ApolloCache, useApolloClient, useMutation, useReactiveVar } from '@apollo/client';
import { Alert, IconButton, Portal, Snackbar, Typography, Stack } from '@mui/material';
import { userVar, sessionVar } from '../../../apollo/store';
import { Product } from '../../types/product/product';
import { LIKE_TARGET_PRODUCT, SAVE_PRODUCT, UNSAVE_PRODUCT } from '../../../apollo/user/product';
import { errorText } from '../../feedback';
import { activeQueryNames } from '../../activeQueries';
import { setGuestLike } from '../../guestLikes';
import { LikeGroup } from '../../enums/like.enum';
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
		const duration =
			notice.message === 'Miqdor ombordagi mavjud qoldiqdan oshmoqda.' ||
			notice.message === 'Mahsulot omborda mavjud emas!'
				? 2000
				: 1000;
		const timer = window.setTimeout(() => setNotice((previous) => ({ ...previous, message: '' })), duration);
		return () => window.clearTimeout(timer);
	}, [notice.id, notice.message]);
	const [pending, setPending] = useState<'like' | 'save' | null>(null);
	const actionInFlight = useRef(false);
	const busy = pending !== null;
	const [like] = useMutation<{ likeTargetProduct: Product }, { productId: string }>(LIKE_TARGET_PRODUCT);
	const [save] = useMutation<{ saveProduct: boolean }, { productId: string }>(SAVE_PRODUCT);
	const [unsave] = useMutation<{ unsaveProduct: boolean }, { productId: string }>(UNSAVE_PRODUCT);
	const active = product.productStatus === 'ACTIVE';
	const liked =
		session.status === 'anonymous'
			? Boolean(product.guestLiked)
			: Boolean(product.meLiked?.some((item) => item.myFavorite));
	async function act(bookmark: boolean) {
		if (actionInFlight.current || session.status === 'loading' || session.status === 'error') return;
		if (bookmark && (session.status !== 'authenticated' || !user._id)) {
			showError('Davom etish uchun tizimga kiring.');
			return;
		}
		actionInFlight.current = true;
		setPending(bookmark ? 'save' : 'like');
		clearError();
		try {
			if (bookmark) {
				const nextSaved = !product.meSaved;
				const options = {
					variables: { productId: product._id },
					update(cache: ApolloCache<unknown>) {
						cache.modify({
							id: cache.identify({ __typename: 'Product', _id: product._id }),
							fields: { meSaved: () => nextSaved },
						});
					},
					refetchQueries: () =>
						activeQueryNames(client, ['GetProduct', 'GetProducts', 'GetSavedProducts', 'GetFavorites', 'GetVisited']),
					awaitRefetchQueries: true,
				};
				await (product.meSaved
					? unsave({ ...options, optimisticResponse: { unsaveProduct: true } })
					: save({ ...options, optimisticResponse: { saveProduct: true } }));
			} else if (session.status === 'anonymous') {
				await setGuestLike(client, LikeGroup.PRODUCT, product._id, !liked);
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
			actionInFlight.current = false;
			setPending(null);
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
					<Stack direction="row" alignItems="center" sx={{ flexShrink: 0 }}>
						<IconButton
							className={`quwat-product-like${pending === 'like' ? ' quwat-like-feedback' : ''}`}
							size="small"
							disabled={busy || session.status === 'loading' || session.status === 'error'}
							onClick={() => void act(false)}
							aria-label={t('Yoqtirish')}
							aria-pressed={liked}
							aria-busy={pending === 'like'}
						>
							{liked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
						</IconButton>
						<Typography variant="caption" className="view-cnt" sx={{ ml: -0.5, mr: 0.5 }}>
							{product.productLikes}
						</Typography>
					</Stack>
				)}
				{session.status === 'authenticated' && user.memberType === 'CLIENT' && (active || product.meSaved) && (
					<IconButton
						className={`quwat-product-bookmark${pending === 'save' ? ' quwat-save-feedback' : ''}`}
						size="small"
						disabled={busy}
						onClick={() => void act(true)}
						title={product.meSaved ? t('Saqlanganlardan olib tashlash') : t('Mahsulotni saqlash')}
						sx={{
							color: product.meSaved ? '#000' : '#52525b',
							'&.Mui-disabled': { color: product.meSaved ? '#000' : '#52525b' },
						}}
						aria-busy={pending === 'save'}
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
						disabled={!cart.ready || cart.submitting || Boolean(cart.intent)}
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
