import { serverSideTranslations as loadTranslations } from 'next-i18next/serverSideTranslations';
import config from '../next-i18next.config';
import { i18n } from 'next-i18next';

export const serverSideTranslations = async (locale: string, namespaces = ['common']) => {
	// Refresh all languages during development, including previously visited
	// locales held by next-i18next's server resource cache.
	if (process.env.NODE_ENV === 'development') await i18n?.reloadResources(config.i18n.locales, namespaces);
	return loadTranslations(locale, namespaces, config);
};
