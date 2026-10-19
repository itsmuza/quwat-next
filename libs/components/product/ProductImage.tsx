import { useText } from '../../i18n';
import React, { useState } from 'react';
import Image from 'next/image';
import { imageUrl } from '../../feedback';
export default function ProductImage({
	path,
	name,
	width,
	height,
}: {
	path?: string;
	name: string;
	width: number;
	height: number;
}) {
	const { t } = useText();
	const [failed, setFailed] = useState(false);
	if (!path || failed) return <span>{t('Rasm mavjud emas')}</span>;
	return (
		<Image unoptimized src={imageUrl(path)} alt={name} width={width} height={height} onError={() => setFailed(true)} />
	);
}
