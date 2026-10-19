export function errorText(error: unknown): string {
	const value = error as {
		message?: string;
		graphQLErrors?: {
			message?: string | string[];
			extensions?: { originalError?: { message?: string | string[] } };
		}[];
	};
	const graphQLError = value?.graphQLErrors?.[0];
	const raw =
		graphQLError?.extensions?.originalError?.message ||
		graphQLError?.message ||
		value?.message ||
		'Amal bajarilmadi. Qayta urinib ko‘ring.';
	const message = Array.isArray(raw) ? raw.join(', ') : raw;
	if (/sales transactions require/i.test(message))
		return 'Savdoni qayd qilish hali sozlanmagan. Administratorga murojaat qiling.';
	if (/sale product (price|unit) changed|sale total changed/i.test(message))
		return 'Mahsulot narxi yoki birligi o‘zgargan. Savatchani yangilab, qayta yuboring.';
	if (/insufficient sale stock/i.test(message)) return 'Savatchadagi miqdor ombordagi mavjud qoldiqdan oshmoqda.';
	if (/sale already has a final decision/i.test(message)) return 'So‘rov allaqachon yakunlangan. Ro‘yxatni yangilang.';
	if (/sale reservation is inconsistent/i.test(message))
		return 'Mahsulot bandligini tekshirib bo‘lmadi. Administratorga murojaat qiling.';
	if (/invalid sale quantity/i.test(message)) return 'Mahsulot miqdori, minimal miqdor va qadamni tekshiring.';
	if (/sale .*safe integer/i.test(message)) return 'Hisob qiymati juda katta. Miqdorni kamaytiring.';
	if (/commentContent/i.test(message)) return 'Izoh 1–100 belgidan iborat bo‘lishi kerak.';
	if (/commentRefId/i.test(message)) return 'Izoh yoziladigan sahifani yangilab, qayta urinib ko‘ring.';
	if (/attendance setup required/i.test(message))
		return 'Davomat hali sozlanmagan. Administrator boshlang‘ich sozlashni bajarishi kerak.';
	if (/name uniqueness is not ready/i.test(message))
		return 'Mahsulot nomlarini tekshirish hali tayyor emas. Administrator mavjud takroriy nomlarni tekshirishi kerak.';
	if (/product with this name|name.*unique|name.*exist|duplicate/i.test(message))
		return 'Bu mahsulot nomi band. Boshqa nom kiriting.';
	if (/wrong password/i.test(message)) return 'Parol noto‘g‘ri. Qayta urinib ko‘ring.';
	if (/not authenticated|bearer token/i.test(message)) return 'Davom etish uchun tizimga kiring.';
	if (/no data found|not found/i.test(message)) return 'Ma’lumot topilmadi yoki hozir mavjud emas.';
	if (/stock or reservations exist/i.test(message))
		return 'Qoldiq yoki rezerv mavjud bo‘lganda birlikni almashtirib bo‘lmaydi.';
	if (/below reserved quantity/i.test(message))
		return 'Ombordagi miqdor band qilingan miqdordan kam bo‘lishi mumkin emas.';
	if (/invalid stock quantity/i.test(message)) return 'Ombordagi miqdor va tanlangan birlik mosligini tekshiring.';
	if (/stock update requires expected quantity/i.test(message))
		return 'Mahsulotni qayta ochib, ombordagi miqdorni yangilang.';
	if (/changed concurrently/i.test(message))
		return 'Mahsulot boshqa amal orqali yangilangan. Ro‘yxatni yangilab, qayta urinib ko‘ring.';
	if (/minimum quantity|quantity step/i.test(message)) return 'Birlik, minimal miqdor va qadam mosligini tekshiring.';
	if (/final decision/i.test(message))
		return 'Davomat bo‘yicha yakuniy qaror allaqachon berilgan. Ro‘yxatni yangilang.';
	if (/invalid.*range/i.test(message)) return 'Sana yoki narx oralig‘ini tekshiring.';
	if (/tracking has not started/i.test(message)) return 'Davomat hisobi hali boshlanmagan.';
	if (/specific roles|forbidden|only active/i.test(message)) return 'Bu amal uchun ruxsatingiz yo‘q.';
	if (/already used member/i.test(message)) return 'Foydalanuvchi nomi yoki telefon raqami band.';
	if (/blocked/i.test(message)) return 'Hisobingiz bloklangan.';
	if (/network|fetch|connect/i.test(message)) return 'Serverga ulanib bo‘lmadi. Qayta urinib ko‘ring.';
	if (/^bad request(?: exception)?$/i.test(message)) return 'Kiritilgan ma’lumotlarni tekshirib, qayta urinib ko‘ring.';
	return message;
}
export const imageUrl = (path?: string | null) =>
	!path
		? '/img/profile/defaultUser.svg'
		: path.startsWith('/') || /^https?:\/\//.test(path)
		? path
		: `${process.env.REACT_APP_API_URL || 'http://localhost:3007'}/${path}`;
