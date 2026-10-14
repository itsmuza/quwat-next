import { useText } from '../../libs/i18n';
import React from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { serverSideTranslations } from '../../libs/serverTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
const questions = [
	[
		'Mahsulotni qanday topaman?',
		'Katalogda nom bo‘yicha qidiring yoki kategoriya, birlik, brand va narx filtrlaridan foydalaning.',
	],
	[
		'Mahsulotni qanday saqlayman?',
		'Mijoz hisobingizga kiring va mahsulot kartasidagi “Saqlash” tugmasini bosing. Saqlangan mahsulotlar shaxsiy bo‘limingizda ko‘rinadi.',
	],
	[
		'Saqlash va yoqtirishning farqi nima?',
		'Saqlash — keyinroq ko‘rish uchun shaxsiy ro‘yxat. Yoqtirish esa mahsulotga munosabatingizni bildiradi. Ular bir-biridan mustaqil.',
	],
	[
		'“Sotuvda yo‘q” nimani anglatadi?',
		'Mahsulot arxivlangan. U saqlangan ro‘yxatingizda qoladi, lekin oddiy mahsulot sahifasi ochilmaydi. Uni ro‘yxatdan olib tashlashingiz mumkin.',
	],
	[
		'Davomat qanday ishlaydi?',
		'Agent bugungi davomatni so‘raydi. Administrator tasdiqlagandan keyin agent kelgan hisoblanadi. Yakuniy qarorni qayta o‘zgartirib bo‘lmaydi.',
	],
];
function Help() {
	const { t, locale } = useText();
	return (
		<Stack className="quwat-page quwat-profile" spacing={3}>
			<Typography variant="h3">{t('Yordam')}</Typography>
			<Typography>{t('Ko‘p beriladigan savollar')}</Typography>
			<div>
				{questions.map(([q, a]) => (
					<Accordion key={q}>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Typography fontWeight={600}>{t(q)}</Typography>
						</AccordionSummary>
						<AccordionDetails>
							<Typography>{t(a)}</Typography>
						</AccordionDetails>
					</Accordion>
				))}
			</div>
		</Stack>
	);
}
export default withLayoutBasic(Help);
