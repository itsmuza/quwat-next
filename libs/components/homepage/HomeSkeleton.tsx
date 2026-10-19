import React from 'react';
import { Skeleton } from '@mui/material';
import { useReducedMotion } from 'framer-motion';
import { useText } from '../../i18n';

export default function HomeSkeleton({ members = false }: { members?: boolean }) {
	const { t } = useText();
	const reducedMotion = useReducedMotion();
	return (
		<div className={`quwat-home-skeleton${members ? ' members' : ''}`} role="status" aria-label={t('Yuklanmoqda')}>
			{[0, 1, 2, 3].map((key) => (
				<div className="quwat-home-skeleton-card" key={key} aria-hidden="true">
					<Skeleton variant="rounded" height={members ? 140 : 200} animation={reducedMotion ? false : 'pulse'} />
					<Skeleton width="78%" height={28} animation={reducedMotion ? false : 'pulse'} />
					<Skeleton width="48%" animation={reducedMotion ? false : 'pulse'} />
				</div>
			))}
		</div>
	);
}
