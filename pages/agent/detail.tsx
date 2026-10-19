import React from 'react';
import { serverSideTranslations } from '../../libs/serverTranslations';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import MemberProfile from '../../libs/components/member/MemberProfile';
export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
function AgentDetail() {
	return <MemberProfile agent />;
}
export default withLayoutBasic(AgentDetail);
