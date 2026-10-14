import { useText } from '../../../libs/i18n';
import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { Button, Pagination, Stack, TextField, Typography } from '@mui/material';
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
		<Stack className="quwat-page" spacing={3}>
			<Typography variant="h4">{t('Savdolar')}</Typography>
			<Stack direction="row" gap={2} flexWrap="wrap">
				<TextField
					type="date"
					sx={{ width: 260, maxWidth: '100%' }}
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
					disabled={!valid || report.loading || history.loading}
					onClick={() => {
						void report.refetch();
						void history.refetch();
					}}
				>
					{t('Yangilash')}
				</Button>
			</Stack>
			<QueryState loading={report.loading} error={report.error} retry={() => report.refetch()} />
			{daily && (
				<>
					<Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
						<div className="quwat-sales-stat">
							<Typography color="text.secondary">{t('Tasdiqlangan savdolar')}</Typography>
							<Typography variant="h5">{t('{{count}} ta savdo', { count: daily.salesCount })}</Typography>
						</div>
						<div className="quwat-sales-stat">
							<Typography color="text.secondary">{t('Jami tushum')}</Typography>
							<Typography variant="h5">{money(daily.totalAmount, locale)}</Typography>
						</div>
					</Stack>
				</>
			)}
			<Typography variant="h5">{t('Savdo tarixi')}</Typography>
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
