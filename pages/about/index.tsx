import { useText } from '../../libs/i18n';
import React from 'react';
import Link from 'next/link';
import { Button, Stack, Typography } from '@mui/material';
import { serverSideTranslations } from '../../libs/serverTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
function About() {
	const { t, locale } = useText();
	return (
		<Stack className="quwat-page quwat-profile" spacing={3}>
			<Typography variant="h3" component="h1">
				{t('Quwat haqida')}
			</Typography>
			<Typography>
				{t(
					'Quwat — qurilish materiallari va xo‘jalik buyumlari do‘konining onlayn platformasi. Qurilish, ta’mirlash yoki kundalik xo‘jalik ishlari uchun kerakli mahsulotlarni bir joyda ko‘rib, xaridga tayyorlanishingiz mumkin.',
				)}
			</Typography>
			<Stack component="section" spacing={1.5}>
				<Typography variant="h5" component="h2">
					{t('Maqsadimiz')}
				</Typography>
				<Typography>
					{t(
						'Kerakli buyumni topish va tanlashni osonlashtirishni maqsad qilganmiz. Mahsulotning nomi, narxi, tavsifi va mavjud miqdorini oldindan ko‘rish ishlaringiz uchun xarid ro‘yxatini tuzishga yordam beradi. Quwat orqali izlash, tanlash va xarid so‘rovini yuborish jarayonini bir joyda boshqarishingiz mumkin.',
					)}
				</Typography>
			</Stack>
			<Stack component="section" spacing={1.5}>
				<Typography variant="h5" component="h2">
					{t('Katalogda nimalar bor?')}
				</Typography>
				<Typography>
					{t(
						'Katalogimizda asboblar, mahkamlash buyumlari, santexnika, elektr mollari, bo‘yoq va yelimlar, eshik jihozlari hamda xo‘jalik buyumlari jamlangan. Mahsulotlarni nomi yoki kategoriyasi bo‘yicha qidirib, brand, narx va sotuv birligi bo‘yicha tanlovni toraytirishingiz mumkin.',
					)}
				</Typography>
				<Typography>
					{t(
						'Mahsulot sahifasida uning rasmlari, tavsifi, narxi va ombordagi miqdori ko‘rsatiladi. Dona, qop, metr yoki kilogramm kabi birliklarga e’tibor berib, ish uchun kerakli miqdorni tanlang. Narxlar so‘mda ko‘rsatiladi.',
					)}
				</Typography>
			</Stack>
			<Stack component="section" spacing={1.5}>
				<Typography variant="h5" component="h2">
					{t('Tanlovingizni saqlab boring')}
				</Typography>
				<Typography>
					{t(
						'Hisobingizga kirgach, yoqtirgan mahsulotlaringizni belgilashingiz va keyinroq ko‘rish uchun “Saqlanganlar” bo‘limiga qo‘shishingiz mumkin. Shaxsiy bo‘limdagi yaqinda ko‘rilgan mahsulotlar ro‘yxati oldingi tanlovlaringizga qaytishni osonlashtiradi.',
					)}
				</Typography>
				<Typography>
					{t(
						'Xarid uchun tanlangan mahsulotlarni savatchaga qo‘shing. Savatchada miqdorni o‘zgartirish, har bir mahsulot hisobini va barcha mahsulotlarning jami summasini ko‘rish mumkin.',
					)}
				</Typography>
			</Stack>
			<Stack component="section" spacing={1.5}>
				<Typography variant="h5" component="h2">
					{t('Xarid jarayoni qanday ishlaydi?')}
				</Typography>
				<Stack component="ol" spacing={1} sx={{ m: 0, pl: 3 }}>
					<Typography component="li">
						{t('Katalogdan mahsulot tanlab, savatchaga qo‘shing va kerakli miqdorni belgilang.')}
					</Typography>
					<Typography component="li">
						{t('Jami summani tekshiring, naqd yoki bank kartasi turini tanlab, xarid so‘rovini yuboring.')}
					</Typography>
					<Typography component="li">
						{t('So‘rov yuborilgach, tanlangan miqdor band qilinadi. Do‘konda to‘lov olinganini agent tasdiqlaydi.')}
					</Typography>
					<Typography component="li">
						{t('So‘rov holati va tasdiqlangan xaridlaringizni shaxsiy bo‘limdagi “Xaridlarim” sahifasida kuzating.')}
					</Typography>
				</Stack>
				<Typography>
					{t(
						'Tasdiqlanmagan so‘rovni “Xaridlarim” bo‘limida bekor qilish mumkin. Bank kartasi turini tanlash do‘konda karta orqali olingan to‘lovni qayd etish uchun xizmat qiladi; platforma kartadan avtomatik pul yechmaydi.',
					)}
				</Typography>
			</Stack>
			<Stack component="section" spacing={1.5}>
				<Typography variant="h5" component="h2">
					{t('Savollaringiz bormi?')}
				</Typography>
				<Typography>
					{t(
						'Platformadan foydalanishga oid tushuntirishlarni “Yordam” bo‘limida topishingiz mumkin. “Agentlar” bo‘limida do‘kon agentlarining profillarini ko‘rish, mahsulot sahifalarida esa izoh qoldirish imkoniyati bor.',
					)}
				</Typography>
			</Stack>
			<Stack direction="row" gap={2} flexWrap="wrap">
				<Button component={Link} href="/product" variant="contained">
					{t('Katalogni ko‘rish →')}
				</Button>
				<Button component={Link} href="/cs" variant="outlined">
					{t('Yordam bo‘limi')}
				</Button>
			</Stack>
		</Stack>
	);
}
export default withLayoutBasic(About);
