import React from 'react';
import Link from 'next/link';
import { Button, Stack, Typography } from '@mui/material';
import { useText } from '../libs/i18n';
import { serverSideTranslations } from '../libs/serverTranslations';
import withLayoutBasic from '../libs/components/layout/LayoutBasic';
export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale)) },
});
function ServerError() {
	const { t } = useText();
	return (
		<Stack className="quwat-page quwat-profile" spacing={3}>
			<Typography variant="h3">500 — {t('Server xatosi')}</Typography>
			<Typography>{t('Amal bajarilmadi. Qayta urinib ko‘ring.')}</Typography>
			<Button component={Link} href="/" variant="contained" sx={{ alignSelf: 'flex-start' }}>
				{t('Bosh sahifaga qaytish')}
			</Button>
		</Stack>
	);
}
export default withLayoutBasic(ServerError);
