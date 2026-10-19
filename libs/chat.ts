export interface ChatMessage {
	id?: string;
	text: string;
	senderId?: string;
	createdAt?: string;
	memberData: { _id: string; memberNick: string; memberImage?: string } | null;
}
export function readChatMessage(value: unknown): ChatMessage | null {
	const message = value as Partial<ChatMessage> | null;
	if (!message || typeof message.text !== 'string' || !message.text.trim() || message.text.length > 1000) return null;
	const member = message.memberData;
	return {
		text: message.text,
		...(typeof message.id === 'string' ? { id: message.id } : {}),
		...(typeof message.senderId === 'string' ? { senderId: message.senderId } : {}),
		...(typeof message.createdAt === 'string' && Number.isFinite(Date.parse(message.createdAt))
			? { createdAt: message.createdAt }
			: {}),
		memberData:
			member && typeof member._id === 'string' && typeof member.memberNick === 'string'
				? {
						_id: member._id,
						memberNick: member.memberNick,
						...(typeof member.memberImage === 'string' ? { memberImage: member.memberImage } : {}),
				  }
				: null,
	};
}
