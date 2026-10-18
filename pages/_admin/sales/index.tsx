import { useText } from '../../../libs/i18n';
import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Button, Pagination, Stack, TextField, Typography } from '@mui/material';
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined';
import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import { serverSideTranslations } from '../../../libs/serverTranslations';
import { GET_ALL_SALES_BY_ADMIN, GET_DAILY_SALES_BY_ADMIN } from '../../../apollo/user/sale';
import { DailySalesReport, Sales } from '../../../libs/types/sale';
import { tashkentDate, validDate } from '../../../libs/attendance';
import { money, totalOf } from '../../../libs/product';
import withAdminLayout from '../../../libs/components/layout/LayoutAdmin';
import QueryState from '../../../libs/components/common/QueryState';
import SaleCards from '../../../libs/components/sale/SaleCards';
const HISTORY_PAGE_SIZE = 10;
export const getStaticProps = async ({ locale }: { locale: string }) => ({
	props: { ...(await serverSideTranslations(locale, ['common'])) },
});
function AdminSales() {
	const { t, locale } = useText();
	const [date, setDate] = useState(tashkentDate()),
		[page, setPage] = useState(1);
	const valid = validDate(date);
	const report = useQuery<{ getDailySalesByAdmin: DailySalesReport }>(GET_DAILY_SALES_BY_ADMIN, {
		variables: { input: { date } },
		skip: !valid,
		fetchPolicy: 'network-only',
	});
	const history = useQuery<{ getAllSalesByAdmin: Sales }>(GET_ALL_SALES_BY_ADMIN, {
		variables: { input: { page, limit: HISTORY_PAGE_SIZE, date, saleStatus: 'COMPLETED' } },
		skip: !valid,
		fetchPolicy: 'network-only',
	});
	const daily =
			valid && !report.loading && !report.error && report.data?.getDailySalesByAdmin.date === date
				? report.data.getDailySalesByAdmin
				: undefined,
		rows = valid && !history.loading && !history.error ? history.data?.getAllSalesByAdmin : undefined;
	return (
		<Stack className="quwat-page quwat-admin-sales" spacing={2}>
			<section className="quwat-sales-overview" aria-labelledby="sales-overview-title">
				<div className="quwat-sales-overview-header">
					<div className="quwat-sales-heading">
						<span className="quwat-sales-heading-icon">
							<ReceiptLongOutlined />
						</span>
						<Typography id="sales-overview-title" className="quwat-admin-sales-title" variant="h4">
							{t('Savdolar')}
						</Typography>
					</div>
					<div className="quwat-admin-sales-filters">
						<TextField
							type="date"
							size="small"
							label={t('Savdo kuni (Toshkent)')}
							InputLabelProps={{ shrink: true }}
							value={date}
							error={!valid}
							onChange={(event) => {
								setDate(event.target.value);
								setPage(1);
							}}
						/>
						<Button
							startIcon={<RefreshRounded />}
							disabled={!valid || report.loading || history.loading}
							onClick={() => {
								void report.refetch();
								void history.refetch();
							}}
						>
							{t('Yangilash')}
						</Button>
					</div>
				</div>
				<QueryState loading={report.loading} error={report.error} retry={() => report.refetch()} />
				{daily && (
					<div className="quwat-admin-sales-summary">
						<div className="quwat-sales-metric">
							<span className="quwat-sales-metric-icon">
								<ReceiptLongOutlined />
							</span>
							<div>
								<Typography className="quwat-sales-metric-label">{t('Tasdiqlangan savdolar')}</Typography>
								<Typography className="quwat-sales-metric-value">
									{t('{{count}} ta savdo', { count: daily.salesCount })}
								</Typography>
							</div>
						</div>
						<div className="quwat-sales-metric quwat-sales-metric-revenue">
							<span className="quwat-sales-metric-icon">
								<AccountBalanceWalletOutlined />
							</span>
							<div>
								<Typography className="quwat-sales-metric-label">{t('Jami tushum')}</Typography>
								<Typography className="quwat-sales-metric-value">{money(daily.totalAmount, locale)}</Typography>
							</div>
						</div>
					</div>
				)}
			</section>
			<Typography className="quwat-admin-sales-history-title" variant="h5">
				{t('Savdo tarixi')}
			</Typography>
			<QueryState loading={history.loading} error={history.error} retry={() => history.refetch()} />
			{rows && <SaleCards sales={rows.list} columns={2} />}
			<Pagination
				page={page}
				count={Math.max(1, Math.ceil(totalOf(rows) / HISTORY_PAGE_SIZE))}
				onChange={(_, value) => setPage(value)}
			/>
		</Stack>
	);
}
export default withAdminLayout(AdminSales);
