import { useText } from '../../i18n';
import Image from 'next/image';
import React, { FormEvent, useState } from 'react';
import { useMutation } from '@apollo/client';
import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { CREATE_PRODUCT, UPDATE_PRODUCT } from '../../../apollo/admin/product';
import { Product, ProductInput, ProductUpdate } from '../../types/product/product';
import { ProductType, ProductUnit, ProductStatus, productTypeLabels, unitLabels } from '../../enums/product.enum';
import { validateProduct } from '../../product';
import { errorText, imageUrl } from '../../feedback';
import { uploadImages } from '../../upload';
export default function ProductForm({
	product,
	close,
	saved,
}: {
	product?: Product;
	close: () => void;
	saved: () => unknown;
}) {
	const { t, errorMessage: translateError } = useText();
	const [form, setForm] = useState({
		productName: product?.productName || '',
		productType: product?.productType || ProductType.ASBOBLAR,
		productUnit: product?.productUnit || ProductUnit.DONA,
		productPrice: product?.productPrice.toString() || '0',
		productQuantity: product?.productQuantity.toString() || '0',
		productBrand: product?.productBrand || '',
		productDesc: product?.productDesc || '',
		productMinOrderQuantity: product?.productMinOrderQuantity.toString() || '1',
		productQuantityStep: product?.productQuantityStep.toString() || '1',
	});
	const [images, setImages] = useState(product?.productImages || []);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [create] = useMutation<{ createProduct: Product }, { input: ProductInput }>(CREATE_PRODUCT);
	const [update] = useMutation<{ updateProduct: Product }, { input: ProductUpdate }>(UPDATE_PRODUCT);
	const lockedUnit = Boolean(product && (product.productQuantity !== 0 || product.productReservedQuantity !== 0));
	async function upload(files: File[]) {
		setBusy(true);
		setError('');
		try {
			if (images.length + files.length > 5) throw new Error('Jami 5 tagacha rasm yuklash mumkin.');
			const uploaded = await uploadImages(files, 'product');
			setImages([...images, ...uploaded]);
		} catch (error) {
			setError(errorText(error));
		} finally {
			setBusy(false);
		}
	}
	async function submit(event: FormEvent) {
		event.preventDefault();
		setError('');
		const input: ProductInput = {
			...form,
			productName: form.productName.trim(),
			productPrice: Number(form.productPrice),
			productQuantity: Number(form.productQuantity),
			productMinOrderQuantity: Number(form.productMinOrderQuantity),
			productQuantityStep: Number(form.productQuantityStep),
			productImages: images,
		};
		const problem = validateProduct(input, product?.productReservedQuantity || 0);
		if (problem) {
			setError(problem);
			return;
		}
		setBusy(true);
		try {
			if (product) {
				const { productQuantity, ...details } = input;
				const stockChanged = productQuantity !== product.productQuantity;
				await update({
					variables: {
						input: {
							...details,
							_id: product._id,
							...(stockChanged ? { productQuantity, expectedProductQuantity: product.productQuantity } : {}),
						},
					},
				});
			} else await create({ variables: { input: { ...input, productStatus: ProductStatus.DRAFT } } });
			await saved();
			close();
		} catch (error) {
			setError(errorText(error));
		} finally {
			setBusy(false);
		}
	}
	return (
		<Dialog open onClose={busy ? undefined : close} fullWidth maxWidth="md">
			<DialogTitle>{product ? t('Mahsulotni tahrirlash') : t('Yangi mahsulot — qoralama')}</DialogTitle>
			<form onSubmit={submit}>
				<DialogContent>
					<Stack spacing={3}>
						{error && <Alert severity="error">{translateError(error)}</Alert>}
						<div className="quwat-form-grid">
							<TextField
								label={t('Mahsulot nomi')}
								required
								value={form.productName}
								onChange={(e) => setForm({ ...form, productName: e.target.value })}
								inputProps={{ minLength: 3, maxLength: 100 }}
							/>
							<TextField
								label={t('Narx (so‘m)')}
								type="number"
								required
								value={form.productPrice}
								onChange={(e) => setForm({ ...form, productPrice: e.target.value })}
								inputProps={{ min: 0, step: 1, max: Number.MAX_SAFE_INTEGER }}
							/>
							<TextField
								select
								label={t('Kategoriya')}
								value={form.productType}
								onChange={(e) => setForm({ ...form, productType: e.target.value as ProductType })}
							>
								{Object.values(ProductType).map((v) => (
									<MenuItem key={v} value={v}>
										{t(productTypeLabels[v])}
									</MenuItem>
								))}
							</TextField>
							<TextField
								label={t('Ombordagi jami miqdor')}
								required
								type="number"
								value={form.productQuantity}
								onChange={(e) => setForm({ ...form, productQuantity: e.target.value })}
								inputProps={{
									min: product?.productReservedQuantity || 0,
									max: 1000000000,
									step: [ProductUnit.DONA, ProductUnit.QOP].includes(form.productUnit) ? 1 : 0.001,
								}}
								helperText={t('Jami qoldiq ({{unit}}). {{hint}}', {
									unit: t(unitLabels[form.productUnit]),
									hint: [ProductUnit.DONA, ProductUnit.QOP].includes(form.productUnit)
										? t('Butun son kiriting.')
										: t('Uch kasr xonasigacha kiritish mumkin.'),
								})}
							/>
							<TextField
								select
								label={t('Birlik')}
								disabled={lockedUnit}
								helperText={lockedUnit ? t('Qoldiq yoki rezerv bor: birlikni almashtirib bo‘lmaydi.') : ''}
								value={form.productUnit}
								onChange={(e) => {
									const unit = e.target.value as ProductUnit;
									const n = [ProductUnit.DONA, ProductUnit.QOP].includes(unit) ? '1' : '0.001';
									setForm({ ...form, productUnit: unit, productMinOrderQuantity: n, productQuantityStep: n });
								}}
							>
								{Object.values(ProductUnit).map((v) => (
									<MenuItem key={v} value={v}>
										{t(unitLabels[v])}
									</MenuItem>
								))}
							</TextField>
							<TextField
								label={t('Minimal miqdor')}
								required
								type="number"
								inputProps={{
									min: [ProductUnit.DONA, ProductUnit.QOP].includes(form.productUnit) ? 1 : 0.001,
									step: [ProductUnit.DONA, ProductUnit.QOP].includes(form.productUnit) ? 1 : 0.001,
									max: 1000000000,
								}}
								value={form.productMinOrderQuantity}
								onChange={(e) => setForm({ ...form, productMinOrderQuantity: e.target.value })}
							/>
							<TextField
								label={t('Miqdor qadami')}
								required
								type="number"
								inputProps={{
									min: [ProductUnit.DONA, ProductUnit.QOP].includes(form.productUnit) ? 1 : 0.001,
									step: [ProductUnit.DONA, ProductUnit.QOP].includes(form.productUnit) ? 1 : 0.001,
									max: 1000000000,
								}}
								value={form.productQuantityStep}
								onChange={(e) => setForm({ ...form, productQuantityStep: e.target.value })}
							/>
							<TextField
								label={t('Brand')}
								value={form.productBrand}
								onChange={(e) => setForm({ ...form, productBrand: e.target.value })}
							/>
							{product && (
								<Typography>
									{t('Band qilingan:')} {product.productReservedQuantity} {t(unitLabels[product.productUnit])}
								</Typography>
							)}
						</div>
						<TextField
							InputLabelProps={{ shrink: true }}
							label={t('Tavsif')}
							value={form.productDesc}
							onChange={(e) => setForm({ ...form, productDesc: e.target.value })}
						/>
						<Stack direction="row" gap={2} flexWrap="wrap">
							{images.map((image, index) => (
								<Stack key={image + index} alignItems="center">
									<Image
										unoptimized
										src={imageUrl(image)}
										alt={t('Mahsulot rasmi {{number}}', { number: index + 1 })}
										width={80}
										height={80}
										style={{ objectFit: 'contain' }}
									/>
									<Button color="error" disabled={busy} onClick={() => setImages(images.filter((_, i) => i !== index))}>
										{t('Olib tashlash')}
									</Button>
								</Stack>
							))}
						</Stack>
						<Button component="label" disabled={busy || images.length >= 5}>
							{t('Rasm yuklash (JPG/PNG, 5 tagacha)')}{' '}
							<input
								hidden
								type="file"
								accept="image/jpeg,image/png"
								multiple
								onChange={(e) => {
									const files = Array.from(e.target.files || []);
									e.target.value = '';
									if (files.length) void upload(files);
								}}
							/>
						</Button>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button disabled={busy} onClick={close}>
						{t('Bekor qilish')}
					</Button>
					<Button disabled={busy} type="submit" variant="contained">
						{busy ? t('Kutilmoqda…') : t('Saqlash')}
					</Button>
				</DialogActions>
			</form>
		</Dialog>
	);
}
