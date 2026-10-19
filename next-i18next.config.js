/** @type {import('next-i18next').UserConfig} */
module.exports = {
	i18n: { defaultLocale: 'uz', locales: ['uz', 'en', 'kr', 'ru'], localeDetection: false },
	fallbackLng: 'uz',
	returnNull: false,
	keySeparator: false,
	nsSeparator: false,
	interpolation: { escapeValue: false },
	reloadOnPrerender: process.env.NODE_ENV === 'development',
};
