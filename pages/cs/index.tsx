import { useText } from '../../libs/i18n';
import React, { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Button, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
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
	const { t } = useText();
	const [topic, setTopic] = useState('all');
	const [text, setText] = useState('');
	const [search, setSearch] = useState('');
	const [expanded, setExpanded] = useState('');
	useEffect(() => {
		setExpanded(questions[0][0]);
	}, []);
	const topics = [
		{ key: 'all', label: 'Barchasi', Icon: GridViewOutlinedIcon },
		{ key: 'products', label: 'Mahsulotlar', Icon: Inventory2OutlinedIcon },
		{ key: 'saved', label: 'Saqlanganlar', Icon: BookmarkBorderRoundedIcon },
		{ key: 'agents', label: 'Agentlar', Icon: SupportAgentRoundedIcon },
	];
	const visible = questions.filter(([q, a], index) => {
		const category = index === 0 ? 'products' : index === 4 ? 'agents' : 'saved';
		return (topic === 'all' || topic === category) && `${t(q)} ${t(a)}`.toLowerCase().includes(search.toLowerCase());
	});
	return (
		<Stack className="quwat-page quwat-profile quwat-help-page" spacing={3}>
			<section className="quwat-desktop-only quwat-help-hero">
				<div className="container">
					<nav>
						<Link href="/">Quwat</Link>
						<span>/</span>
						<span>{t('Yordam')}</span>
					</nav>
					<h1>{t('Yordam va FAQ markazi')}</h1>
					<p>{t('Ko‘p beriladigan savollar')}</p>
					<form
						onSubmit={(event: FormEvent) => {
							event.preventDefault();
							setSearch(text.trim());
						}}
					>
						<SearchRoundedIcon aria-hidden="true" />
						<input
							aria-label={t('Savollar bo‘yicha qidirish')}
							placeholder={t('Savollar bo‘yicha qidirish')}
							value={text}
							onChange={(e) => setText(e.target.value)}
						/>
						<Button variant="contained" type="submit">
							{t('Qidirish')}
						</Button>
					</form>
				</div>
			</section>
			<nav className="quwat-desktop-only quwat-help-topics" aria-label={t('Yordam')}>
				{topics.map(({ key, label, Icon }) => (
					<button
						type="button"
						key={key}
						aria-pressed={topic === key}
						onClick={() => {
							setTopic(key);
							setSearch('');
							setText('');
						}}
					>
						<Icon aria-hidden="true" />
						<span>{t(label)}</span>
					</button>
				))}
			</nav>
			<div className="quwat-help-columns">
				<section className="quwat-help-questions" aria-labelledby="faq-title">
					<Typography variant="h3" className="quwat-help-legacy-title">
						{t('Yordam')}
					</Typography>
					<Typography id="faq-title" component="h2">
						{t('Ko‘p beriladigan savollar')}
					</Typography>
					<div aria-live="polite">
						{visible.map(([q, a]) => (
							<Accordion key={q} expanded={expanded === q} onChange={(_, open) => setExpanded(open ? q : '')}>
								<AccordionSummary expandIcon={<ExpandMoreIcon />}>
									<Typography fontWeight={600}>{t(q)}</Typography>
								</AccordionSummary>
								<AccordionDetails>
									<Typography>{t(a)}</Typography>
								</AccordionDetails>
							</Accordion>
						))}
						{!visible.length && <Alert severity="info">{t('Savol topilmadi. Boshqa so‘z bilan qidiring.')}</Alert>}
					</div>
				</section>
				<aside className="quwat-desktop-only quwat-help-support">
					<SupportAgentRoundedIcon aria-hidden="true" />
					<h2>{t('Savollaringiz bormi?')}</h2>
					<p>
						{t(
							'Platformadan foydalanishga oid tushuntirishlarni “Yordam” bo‘limida topishingiz mumkin. “Agentlar” bo‘limida do‘kon agentlarining profillarini ko‘rish, mahsulot sahifalarida esa izoh qoldirish imkoniyati bor.',
						)}
					</p>
					<Button component={Link} href="/agent" variant="contained">
						{t('Agentlar')}
					</Button>
					<Button component={Link} href="/product" variant="outlined">
						{t('Katalogni ko‘rish →')}
					</Button>
				</aside>
			</div>
		</Stack>
	);
}
export default withLayoutBasic(Help);
