import { useText } from '../../i18n';
import React, { ReactNode, useEffect } from 'react';
import { useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { Alert } from '@mui/material';
import { sessionVar, userVar } from '../../../apollo/store';
import { restoreSession } from '../../auth';
import QueryState from './QueryState';
export default function SessionGate({ children, role }: { children: ReactNode; role?: string }) {
	const { t } = useText();
	const session = useReactiveVar(sessionVar);
	const user = useReactiveVar(userVar);
	const router = useRouter();
	useEffect(() => {
		if (session.status === 'anonymous')
			void router.replace({ pathname: '/account/join', query: { referrer: router.asPath } });
	}, [session.status, router]);
	if (session.status === 'loading') return <QueryState loading />;
	if (session.status === 'error') return <QueryState error={new Error(session.error)} retry={restoreSession} />;
	if (session.status !== 'authenticated') return null;
	if (role && user.memberType !== role)
		return <Alert severity="warning">{t('Bu bo‘lim uchun ruxsatingiz yo‘q.')}</Alert>;
	return <>{children}</>;
}
