import { useText } from '../../i18n';
import React from 'react';
import Link from 'next/link';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useQuery, useReactiveVar } from '@apollo/client';
import { Alert, Stack } from '@mui/material';
import { GET_AGENTS } from '../../../apollo/user/query';
import { sessionVar } from '../../../apollo/store';
import { Members } from '../../types/member/member';
import MemberCard from '../common/MemberCard';
import QueryState from '../common/QueryState';
import HomeSkeleton from './HomeSkeleton';
export default function TopAgents() {
	const { t } = useText();
	const session = useReactiveVar(sessionVar);
	const { data, loading, error, refetch } = useQuery<{ getAgents: Members }>(GET_AGENTS, {
		variables: { input: { page: 1, limit: 4, sort: 'memberRank', direction: 'DESC', search: {} } },
		skip: session.status === 'loading',
	});
	return (
		<Stack component="section" className="top-agents" aria-labelledby="home-agents-title">
			<Stack className="container">
				<div className="info-box">
					<div className="left">
						<h2 id="home-agents-title">{t('Agentlar')}</h2>
						<p>{t('Quwat jamoasi')}</p>
					</div>
					<Link passHref className="quwat-home-view-all" href="/agent">
						{t('Barchasini ko‘rish')}
						<ArrowForwardRoundedIcon aria-hidden="true" />
					</Link>
				</div>
				<QueryState error={error} retry={() => refetch()} />
				{session.status === 'loading' || (loading && !data) ? (
					<HomeSkeleton members />
				) : (
					<div className="wrapper quwat-agent-grid">
						{data?.getAgents.list.map((m) => (
							<MemberCard key={m._id} member={m} showNickname={false} showProfileLink />
						))}
					</div>
				)}
				{data && !data.getAgents.list.length && <Alert severity="info">{t('Hozircha agentlar yo‘q.')}</Alert>}
			</Stack>
		</Stack>
	);
}
