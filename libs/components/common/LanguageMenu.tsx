import React, { useState } from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import { CaretDown } from 'phosphor-react';
import { useRouter } from 'next/router';
import { useText } from '../../i18n';

export default function LanguageMenu({ onLightBackground = false }: { onLightBackground?: boolean }) {
	const { t } = useText();
	const router = useRouter();
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);
	return (
		<>
			<Button
				className="btn-lang"
				color="inherit"
				sx={onLightBackground ? { color: '#181a20' } : undefined}
				onClick={(e) => setAnchor(e.currentTarget)}
				endIcon={<CaretDown size={14} />}
				aria-label={t('Til tanlash')}
				aria-haspopup="menu"
				aria-expanded={Boolean(anchor)}
			>
				{(router.locale || 'uz').toUpperCase()}
			</Button>
			<Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
				{[
					['uz', 'O‘zbekcha'],
					['en', 'English'],
					['kr', '한국어'],
					['ru', 'Русский'],
				].map(([locale, label]) => (
					<MenuItem
						key={locale}
						selected={router.locale === locale}
						onClick={() => {
							setAnchor(null);
							void router.push({ pathname: router.pathname, query: router.query }, router.asPath, {
								locale,
								scroll: false,
							});
						}}
					>
						{label}
					</MenuItem>
				))}
			</Menu>
		</>
	);
}
