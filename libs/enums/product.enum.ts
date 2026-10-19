export enum ProductType {
	ASBOBLAR = 'ASBOBLAR',
	MAHKAMLASH_BUYUMLARI = 'MAHKAMLASH_BUYUMLARI',
	SANTEXNIKA = 'SANTEXNIKA',
	ELEKTR_MOLLARI = 'ELEKTR_MOLLARI',
	BOYOQ_VA_YELIMLAR = 'BOYOQ_VA_YELIMLAR',
	ESHIK_JIHOZLARI = 'ESHIK_JIHOZLARI',
	XOJALIK_BUYUMLARI = 'XOJALIK_BUYUMLARI',
}
export enum ProductUnit {
	DONA = 'DONA',
	QOP = 'QOP',
	METR = 'METR',
	KG = 'KG',
}
export enum ProductStatus {
	DRAFT = 'DRAFT',
	ACTIVE = 'ACTIVE',
	ARCHIVED = 'ARCHIVED',
}
export const productTypeLabels: Record<ProductType, string> = {
	ASBOBLAR: 'Asboblar',
	MAHKAMLASH_BUYUMLARI: 'Mahkamlash buyumlari',
	SANTEXNIKA: 'Santexnika',
	ELEKTR_MOLLARI: 'Elektr mollari',
	BOYOQ_VA_YELIMLAR: 'Bo‘yoq va yelimlar',
	ESHIK_JIHOZLARI: 'Eshik jihozlari',
	XOJALIK_BUYUMLARI: 'Xo‘jalik buyumlari',
};
export const unitLabels: Record<ProductUnit, string> = { DONA: 'dona', QOP: 'qop', METR: 'metr', KG: 'kilogramm' };
export const statusLabels: Record<ProductStatus, string> = {
	DRAFT: 'Qoralama',
	ACTIVE: 'Sotuvda',
	ARCHIVED: 'Arxivlangan',
};
