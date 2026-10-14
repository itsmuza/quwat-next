export const getServerSideProps = async () => ({ redirect: { destination: '/_admin/products', permanent: false } });
export default function AdminIndex() {
	return null;
}
