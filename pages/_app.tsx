import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme, ThemeOptions } from '@mui/material/styles';
import { enUS, ruRU, koKR } from '@mui/material/locale';
import { CssBaseline } from '@mui/material';
import React, { useEffect, useMemo } from 'react';
import Router, { useRouter } from 'next/router';
import { useText } from '../libs/i18n';
import { restoreSession } from '../libs/auth';
import { light } from '../scss/MaterialTheme';
import { ApolloProvider } from '@apollo/client';
import { useApollo } from '../apollo/client';
import { appWithTranslation } from 'next-i18next';
import '../scss/app.scss';
import '../scss/pc/main.scss';
import '../scss/mobile/main.scss';
import '../scss/quwat.scss';
import CartSession from '../libs/components/cart/CartSession';

const App = ({ Component, pageProps }: AppProps) => {
	const router = useRouter();
	const { t } = useText();
	const theme = useMemo(
		() =>
			createTheme(light as ThemeOptions, router.locale === 'ru' ? ruRU : router.locale === 'kr' ? koKR : enUS, {
				components: {
					MuiPagination: {
						defaultProps: {
							'aria-label': t('Sahifalar'),
							getItemAriaLabel: (type: string, page: number, selected: boolean) => {
								if (type === 'page') return t(selected ? 'Joriy sahifa: {{page}}' : '{{page}}-sahifa', { page });
								return t(
									(
										{
											first: 'Birinchi sahifa',
											last: 'Oxirgi sahifa',
											previous: 'Oldingi sahifa',
											next: 'Keyingi sahifa',
										} as Record<string, string>
									)[type] || 'Sahifalar',
								);
							},
						},
					},
				},
			}),
		[router.locale, t],
	);
	const client = useApollo(pageProps.initialApolloState);
	useEffect(() => {
		const syncLanguage = () => {
			const locale = Router.locale || 'uz';
			document.documentElement.lang = locale === 'kr' ? 'ko' : locale;
		};
		syncLanguage();
		Router.events.on('routeChangeComplete', syncLanguage);
		return () => Router.events.off('routeChangeComplete', syncLanguage);
	}, [router.locale]);
	useEffect(() => {
		void restoreSession();
		const sync = (event: StorageEvent) => {
			if (event.key === 'accessToken') void client.clearStore().then(() => restoreSession());
		};
		const refresh = () => {
			void restoreSession();
		};
		window.addEventListener('storage', sync);
		window.addEventListener('quwat:session-check', refresh);
		window.addEventListener('focus', refresh);
		const clear = () => {
			void client.clearStore();
		};
		window.addEventListener('quwat:logout', clear);
		return () => {
			window.removeEventListener('storage', sync);
			window.removeEventListener('quwat:session-check', refresh);
			window.removeEventListener('focus', refresh);
			window.removeEventListener('quwat:logout', clear);
		};
	}, [client]);

	return (
		<ApolloProvider client={client}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<CartSession />
				<Component {...pageProps} />
			</ThemeProvider>
		</ApolloProvider>
	);
};

export default appWithTranslation(App);
