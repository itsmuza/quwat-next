import React, { useId, useState } from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { CaretDown } from 'phosphor-react';
import { useRouter } from 'next/router';
import { useText } from '../../i18n';

export default function LanguageMenu({ onLightBackground = false }: { onLightBackground?: boolean }) {
	const { t } = useText();
	const router = useRouter();
	const [anchor, setAnchor] = useState<HTMLElement | null>(null);
	const menuId = useId();
	const currentLocale = router.locale || 'uz';
	return (
		<>
			<Button
				id={`${menuId}-trigger`}
				className="btn-lang quwat-language-trigger"
				color="inherit"
				sx={onLightBackground ? { color: '#181a20' } : undefined}
				onClick={(e: React.MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
				endIcon={<CaretDown size={14} />}
				aria-label={t('Til tanlash')}
				aria-haspopup="menu"
				aria-expanded={Boolean(anchor)}
				aria-controls={anchor ? menuId : undefined}
			>
				{currentLocale.toUpperCase()}
			</Button>
			<Menu
				id={menuId}
				anchorEl={anchor}
				open={Boolean(anchor)}
				onClose={() => setAnchor(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
				transformOrigin={{ vertical: 'top', horizontal: 'right' }}
				PaperProps={{ className: 'quwat-language-popover' }}
				MenuListProps={{ 'aria-labelledby': `${menuId}-trigger` }}
			>
				{[
					['uz', 'O‘zbekcha'],
					['en', 'English'],
					['kr', '한국어'],
					['ru', 'Русский'],
				].map(([locale, label]) => (
					<MenuItem
						key={locale}
						className="quwat-language-option"
						role="menuitemradio"
						aria-checked={currentLocale === locale}
						selected={currentLocale === locale}
						onClick={() => {
							setAnchor(null);
							void router.push({ pathname: router.pathname, query: router.query }, router.asPath, {
								locale,
								scroll: false,
							});
						}}
					>
						<span className="quwat-language-code" aria-hidden="true">
							{locale.toUpperCase()}
						</span>
						<span className="quwat-language-name" lang={locale === 'kr' ? 'ko' : locale}>
							{label}
						</span>
						<CheckRoundedIcon className="quwat-language-check" aria-hidden="true" />
					</MenuItem>
				))}
			</Menu>
		</>
	);
}
