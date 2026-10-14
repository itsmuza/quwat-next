import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useCallback } from 'react';

export const localeTag = (locale = 'uz') =>
	({ uz: 'uz-Latn-UZ', en: 'en-US', ru: 'ru-RU', kr: 'ko-KR' }[locale] || 'uz-Latn-UZ');

// Validation helpers keep their language-independent return contract. Translate
// their parameterized messages at the UI boundary, alongside ordinary keys.
export function messageKey(message: string): { key: string; values?: Record<string, string> } {
	for (const prefix of ['Minimal miqdor', 'Miqdor qadami']) {
		if (message.startsWith(`${prefix}: `) && message.endsWith('.'))
			return { key: `${prefix}: {{value}}.`, values: { value: message.slice(prefix.length + 2, -1) } };
	}
	return { key: message };
}

export function useText() {
	const { t: translate } = useTranslation('common');
	const router = useRouter();
	const language = router.locale || 'uz';
	const t = useCallback(
		(message: string, values?: Record<string, unknown>): string => {
			const parsed = messageKey(message);
			return translate(parsed.key, { ...parsed.values, ...values, lng: language }) as string;
		},
		[translate, language],
	);
	const errorMessage = useCallback(
		(message: string) => t(message, { defaultValue: t('Amal bajarilmadi. Qayta urinib ko‘ring.') }),
		[t],
	);
	return { t, errorMessage, locale: localeTag(language) };
}
