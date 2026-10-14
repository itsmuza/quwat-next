import { initializeApollo } from '../apollo/client';
import { IMAGE_UPLOADER, IMAGES_UPLOADER } from '../apollo/user/upload';
export async function uploadImages(files: File[], target: 'product' | 'member'): Promise<string[]> {
	if (!files.length || files.length > (target === 'member' ? 1 : 5))
		throw new Error('Mahsulot uchun 1–5 ta, profil uchun bitta rasm tanlang.');
	if (files.some((file) => !['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)))
		throw new Error('Faqat JPG, JPEG va PNG rasmlar qabul qilinadi.');
	const client = initializeApollo();
	if (target === 'member') {
		const result = await client.mutate<{ imageUploader: string }>({
			mutation: IMAGE_UPLOADER,
			variables: { file: files[0], target },
		});
		if (!result.data?.imageUploader) throw new Error('Rasm yuklanmadi.');
		return [result.data.imageUploader];
	}
	const result = await client.mutate<{ imagesUploader: string[] }>({
		mutation: IMAGES_UPLOADER,
		variables: { files, target },
	});
	const images = result.data?.imagesUploader;
	if (!images || images.length !== files.length || images.some((image) => !image))
		throw new Error('Ayrim rasmlar yuklanmadi. Qayta urinib ko‘ring.');
	return images;
}
