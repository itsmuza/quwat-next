import { useEffect, useState } from 'react';
import { tashkentDate, validMonth } from '../../attendance';
export default function useAttendanceMonth() {
	const [today, setToday] = useState(tashkentDate());
	const [selected, setSelected] = useState('');
	useEffect(() => {
		const timer = window.setInterval(() => setToday(tashkentDate()), 30000);
		return () => window.clearInterval(timer);
	}, []);
	const month = selected || today.slice(0, 7);
	const setMonth = (value: string) => {
		if (validMonth(value) && value <= today.slice(0, 7)) setSelected(value);
	};
	return { today, month, setMonth };
}
