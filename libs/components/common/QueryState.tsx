import { useText } from '../../i18n';
import React from 'react';
import { Alert, Button, CircularProgress, Stack } from '@mui/material';
import { errorText } from '../../feedback';
export default function QueryState({
	loading,
	error,
	retry,
}: {
	loading?: boolean;
	error?: unknown;
	retry?: () => unknown;
}) {
	const { t, errorMessage: translateError } = useText();
	if (loading)
		return (
			<Stack alignItems="center" py={5}>
				<CircularProgress aria-label={t('Yuklanmoqda')} />
			</Stack>
		);
	if (error)
		return (
			<Alert
				severity="error"
				action={
					retry && (
						<Button color="inherit" onClick={() => void retry()}>
							{t('Qayta urinish')}
						</Button>
					)
				}
			>
				{translateError(errorText(error))}
			</Alert>
		);
	return null;
}
