import { useText } from '../../libs/i18n';
import React, { FormEvent, useState } from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Button, Pagination, Stack, TextField, Typography } from '@mui/material';
import { serverSideTranslations } from '../../libs/serverTranslations';
import { GET_AGENTS } from '../../apollo/user/query';
import { sessionVar } from '../../apollo/store';
import { Members } from '../../libs/types/member/member';
import { totalOf } from '../../libs/product';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import QueryState from '../../libs/components/common/QueryState';
import MemberCard from '../../libs/components/common/MemberCard';
export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
function Agents() {
	const { t, locale } = useText();
	const session = useReactiveVar(sessionVar);
	const [page, setPage] = useState(1);
	const [text, setText] = useState('');
	const [search, setSearch] = useState('');
	const { data, loading, error, refetch } = useQuery<{ getAgents: Members }>(GET_AGENTS, {
		variables: { input: { page, limit: 20, search: { text: search || undefined } } },
		skip: session.status === 'loading',
	});
	return (
		<Stack className="quwat-page" spacing={3}>
			<Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
				<Typography variant="h4">{t('Agentlar')}</Typography>
				<Stack
					component="form"
					direction="row"
					alignItems="center"
					gap={1}
					sx={{ width: 380, maxWidth: '100%', ml: 'auto' }}
					onSubmit={(e: FormEvent) => {
						e.preventDefault();
						setSearch(text);
						setPage(1);
					}}
				>
					<TextField
						label={t('Agent nomi')}
						value={text}
						onChange={(e) => setText(e.target.value)}
						sx={{ flex: 1, minWidth: 0 }}
					/>
					<Button variant="contained" type="submit" sx={{ flexShrink: 0 }}>
						{t('Qidirish')}
					</Button>
				</Stack>
			</Stack>
			<QueryState loading={loading && !data} error={error} retry={() => refetch()} />
			<div className="quwat-agent-grid">
				{data?.getAgents.list.map((m) => (
					<MemberCard member={m} key={m._id} />
				))}
			</div>
			{data && !data.getAgents.list.length && <Alert severity="info">{t('Agent topilmadi.')}</Alert>}
			<Pagination
				page={page}
				count={Math.max(1, Math.ceil(totalOf(data?.getAgents) / 20))}
				onChange={(_, v) => setPage(v)}
			/>
		</Stack>
	);
}
export default withLayoutBasic(Agents);
