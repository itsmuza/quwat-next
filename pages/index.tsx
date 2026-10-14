import { useText } from '../libs/i18n';
import Advertisement from '../libs/components/homepage/Advertisement';
import React from 'react';
import { Stack } from '@mui/material';
import { serverSideTranslations } from '../libs/serverTranslations';
import withLayoutMain from '../libs/components/layout/LayoutHome';
import ProductShelf from '../libs/components/homepage/ProductShelf';
import TopAgents from '../libs/components/homepage/TopAgents';
export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
function Home() {
	const { t, locale } = useText();
	return (
		<Stack className="home-page">
			<ProductShelf title={t('Yangi mahsulotlar')} sort="createdAt" />
			<ProductShelf title={t('Ko‘p yoqtirilganlar')} sort="productLikes" />
			<Advertisement />
			<ProductShelf title={t('Ommabop mahsulotlar')} sort="productRank" />
			<TopAgents />
		</Stack>
	);
}
export default withLayoutMain(Home);
