import { useText } from '../../i18n';
import React from 'react';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Stack, Typography } from '@mui/material';
import { GET_AGENTS } from '../../../apollo/user/query';
import { sessionVar } from '../../../apollo/store';
import { Members } from '../../types/member/member';
import MemberCard from '../common/MemberCard';
import QueryState from '../common/QueryState';
export default function TopAgents() {
	const { t } = useText();
	const session = useReactiveVar(sessionVar);
	const { data, loading, error, refetch } = useQuery<{ getAgents: Members }>(GET_AGENTS, {
		variables: { input: { page: 1, limit: 4, sort: 'memberRank', direction: 'DESC', search: {} } },
		skip: session.status === 'loading',
	});
	return (
		<Stack className="top-agents">
			<Stack className="container">
				<div className="info-box">
					<div className="left">
						<span>{t('Agentlar')}</span>
						<p>{t('Quwat jamoasi')}</p>
					</div>
				</div>
				<QueryState loading={loading && !data} error={error} retry={() => refetch()} />
				<div className="wrapper quwat-agent-grid">
					{data?.getAgents.list.map((m) => (
						<MemberCard key={m._id} member={m} showNickname={false} />
					))}
				</div>
				{data && !data.getAgents.list.length && <Alert severity="info">{t('Hozircha agentlar yo‘q.')}</Alert>}
			</Stack>
		</Stack>
	);
}
