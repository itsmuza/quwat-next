import { ProductInput, ProductsInquiry, ProductSort } from './types/product/product';
import { ProductType, ProductUnit } from './enums/product.enum';
export const defaultInquiry: ProductsInquiry = { page: 1, limit: 20, sort: 'createdAt', direction: 'DESC', search: {} };
export const productSorts: ProductSort[] = [
	'createdAt',
	'updatedAt',
	'productLikes',
	'productViews',
	'productRank',
	'productPrice',
];
export const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
export const money = (value: number, locale = 'uz-Latn-UZ') =>
	locale.startsWith('uz')
		? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value)} so‘m`
		: new Intl.NumberFormat(locale, { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(value);
export const totalOf = (data?: { metaCounter?: { total?: number }[] | null }) => data?.metaCounter?.[0]?.total || 0;
export function parseInquiry(raw: unknown): ProductsInquiry {
	try {
		if (typeof raw !== 'string') return { ...defaultInquiry, search: {} };
		const input = JSON.parse(raw);
		if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error();
		const search = input.search || {};
		const next: ProductsInquiry = { ...defaultInquiry, search: {} };
		if (Number.isInteger(input.page) && input.page >= 1) next.page = input.page;
		if (Number.isInteger(input.limit) && input.limit >= 1 && input.limit <= 100) next.limit = input.limit;
		if (productSorts.includes(input.sort)) next.sort = input.sort;
		if (['ASC', 'DESC'].includes(input.direction)) next.direction = input.direction;
		if (typeof search.text === 'string' && search.text.trim()) next.search.text = search.text.trim().slice(0, 100);
		if (typeof search.inStock === 'boolean') next.search.inStock = search.inStock;
		if (Array.isArray(search.typeList)) {
			const values = search.typeList.filter((v: ProductType) => Object.values(ProductType).includes(v));
			if (values.length) next.search.typeList = Array.from(new Set<ProductType>(values)).slice(0, 7);
		}
		if (Array.isArray(search.unitList)) {
			const values = search.unitList.filter((v: ProductUnit) => Object.values(ProductUnit).includes(v));
			if (values.length) next.search.unitList = Array.from(new Set<ProductUnit>(values)).slice(0, 4);
		}
		if (Array.isArray(search.brandList)) {
			const values = search.brandList
				.filter((v: unknown) => typeof v === 'string' && v.trim())
				.map((v: string) => v.trim());
			if (values.length) next.search.brandList = Array.from(new Set<string>(values)).slice(0, 100);
		}
		if (search.pricesRange) {
			const range: { start?: number; end?: number } = {};
			for (const key of ['start', 'end'] as const) {
				const n = search.pricesRange[key];
				if (Number.isSafeInteger(n) && n >= 0) range[key] = n;
			}
			if (range.start === undefined || range.end === undefined || range.start <= range.end) {
				if (Object.keys(range).length) next.search.pricesRange = range;
			}
		}
		if (search.periodsRange) {
			const range: { start?: string; end?: string } = {};
			for (const key of ['start', 'end'] as const) {
				const v = search.periodsRange[key];
				if (typeof v === 'string' && Number.isFinite(Date.parse(v))) range[key] = new Date(v).toISOString();
			}
			if (range.start === undefined || range.end === undefined || range.start <= range.end) {
				if (Object.keys(range).length) next.search.periodsRange = range;
			}
		}
		return next;
	} catch {
		return { ...defaultInquiry, search: {} };
	}
}
export function validateProduct(input: ProductInput, reservedQuantity = 0): string | null {
	if (input.productName.trim().length < 3 || input.productName.trim().length > 100)
		return 'Mahsulot nomi 3–100 belgidan iborat bo‘lsin.';
	if (!Number.isSafeInteger(input.productPrice) || input.productPrice < 0)
		return 'Narx butun, manfiy bo‘lmagan so‘m miqdori bo‘lsin.';
	const whole = [ProductUnit.DONA, ProductUnit.QOP].includes(input.productUnit);
	const quantity = input.productQuantity ?? 0;
	if (
		!Number.isFinite(quantity) ||
		quantity < 0 ||
		quantity > 1000000000 ||
		Math.abs(quantity * 1000 - Math.round(quantity * 1000)) >= 0.000001 ||
		(whole && !Number.isInteger(quantity))
	)
		return whole
			? 'Ombordagi miqdor 0–1 000 000 000 oralig‘ida butun son bo‘lsin.'
			: 'Ombordagi miqdor 0–1 000 000 000 oralig‘ida, uch kasr xonasigacha bo‘lsin.';
	if (quantity < reservedQuantity) return 'Ombordagi miqdor band qilingan miqdordan kam bo‘lishi mumkin emas.';
	const minimum = input.productMinOrderQuantity ?? (whole ? 1 : 0.001);
	const step = input.productQuantityStep ?? (whole ? 1 : 0.001);
	for (const value of [minimum, step]) {
		if (
			!Number.isFinite(value) ||
			value <= 0 ||
			value > 1000000000 ||
			Math.abs(value * 1000 - Math.round(value * 1000)) > 0.00001 ||
			(whole && !Number.isInteger(value))
		)
			return whole
				? 'Dona va qop uchun minimum hamda qadam musbat butun son bo‘lsin.'
				: 'Minimum va qadam musbat, uch kasr xonasigacha bo‘lsin.';
	}
	if (Math.round(minimum * 1000) % Math.round(step * 1000) !== 0) return 'Minimum miqdor qadamga karrali bo‘lsin.';
	return null;
}
