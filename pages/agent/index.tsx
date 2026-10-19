import { useText } from '../../libs/i18n';
import React, { FormEvent, useEffect, useState } from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Button, Stack, TextField, Typography } from '@mui/material';
import { serverSideTranslations } from '../../libs/serverTranslations';
import { GET_AGENTS } from '../../apollo/user/query';
import { sessionVar } from '../../apollo/store';
import { Members } from '../../libs/types/member/member';
import { totalOf } from '../../libs/product';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import QueryState from '../../libs/components/common/QueryState';
import { HomeServices } from '../../libs/components/homepage/HomeSupport';
import MemberCard from '../../libs/components/common/MemberCard';
export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
function Agents() {
	const { t } = useText();
	const session = useReactiveVar(sessionVar);
	const [limit, setLimit] = useState(20);
	const [text, setText] = useState('');
	const [search, setSearch] = useState('');
	const { data, loading, error, refetch } = useQuery<{ getAgents: Members }>(GET_AGENTS, {
		variables: { input: { page: 1, limit, search: { text: search || undefined } } },
		skip: session.status === 'loading',
	});
	useEffect(() => {
		const total = totalOf(data?.getAgents);
		if (total > limit) setLimit(total);
	}, [data, limit]);
	return (
		<Stack className="quwat-page quwat-agents-page" spacing={3}>
			<Stack
				className="quwat-agents-toolbar"
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				flexWrap="wrap"
				gap={2}
			>
				<div>
					<Typography variant="h4">{t('Agentlar')}</Typography>
					{data && (
						<span className="quwat-desktop-only quwat-agents-count">
							{t('{{count}} ta agent', { count: totalOf(data.getAgents) })}
						</span>
					)}
				</div>
				<Stack
					component="form"
					direction="row"
					alignItems="center"
					gap={1}
					sx={{ width: 380, maxWidth: '100%', ml: 'auto' }}
					onSubmit={(e: FormEvent) => {
						e.preventDefault();
						setSearch(text);
						setLimit(20);
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
					<MemberCard member={m} key={m._id} showDescription showProfileLink />
				))}
			</div>
			{data && !data.getAgents.list.length && <Alert severity="info">{t('Agent topilmadi.')}</Alert>}
			<div className="quwat-desktop-only quwat-route-services">
				<HomeServices />
			</div>
		</Stack>
	);
}
export default withLayoutBasic(Agents);
