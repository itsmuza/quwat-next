import { useText } from '../i18n';
import React, { useEffect, useState } from 'react';
import { useReactiveVar } from '@apollo/client';
import { Avatar, Stack } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import MarkChatUnreadIcon from '@mui/icons-material/MarkChatUnread';
import ScrollableFeed from 'react-scrollable-feed';
import { socketVar, userVar, sessionVar } from '../../apollo/store';
import { getJwtToken } from '../auth';
import { imageUrl } from '../feedback';
interface Message {
	text: string;
	memberData?: { _id: string; memberNick: string; memberImage?: string } | null;
}
export default function Chat() {
	const { t } = useText();
	const user = useReactiveVar(userVar);
	const session = useReactiveVar(sessionVar);
	const token = session.status === 'authenticated' ? getJwtToken() : '';
	const [messages, setMessages] = useState<Message[]>([]);
	const [online, setOnline] = useState(0);
	const [input, setInput] = useState('');
	const [open, setOpen] = useState(false);
	const [connected, setConnected] = useState(false);
	const socket = useReactiveVar(socketVar);
	useEffect(() => {
		if (session.status === 'loading' || session.status === 'error') return;
		setMessages([]);
		setConnected(false);
		const url = new URL(process.env.REACT_APP_API_WS || 'ws://localhost:3007');
		if (token) url.searchParams.set('token', token);
		const connection = new WebSocket(url.toString());
		socketVar(connection);
		connection.onopen = () => setConnected(true);
		connection.onclose = () => setConnected(false);
		connection.onerror = () => setConnected(false);
		connection.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data.event === 'info') setOnline(data.totalClients);
				else if (data.event === 'getMessages' && Array.isArray(data.list)) setMessages(data.list);
				else if (data.event === 'message' && typeof data.text === 'string')
					setMessages((list) => [...list, data].slice(-50));
			} catch {
				/* Ignore malformed socket messages. */
			}
		};
		return () => {
			connection.onclose = null;
			connection.onmessage = null;
			connection.close();
			if (socketVar() === connection) socketVar(undefined);
		};
	}, [token, session.status]);
	function send() {
		if (!input.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;
		socket.send(JSON.stringify({ event: 'message', data: input.trim() }));
		setInput('');
	}
	return (
		<Stack className="chatting">
			<button
				className="chat-button"
				aria-label={open ? t('Chatni yopish') : t('Chatni ochish')}
				onClick={() => setOpen(!open)}
			>
				{open ? <CloseFullscreenIcon /> : <MarkChatUnreadIcon />}
			</button>
			<Stack className={`chat-frame ${open ? 'open' : ''}`}>
				<div className="chat-top">
					<div>
						{t('Jonli chat ·')} {online}
					</div>
				</div>
				<div className="chat-content">
					<ScrollableFeed>
						<Stack className="chat-main">
							<div className="welcome">{t('Quwat chatiga xush kelibsiz!')}</div>
							{messages.map((message, index) => (
								<Stack
									key={index}
									direction="row"
									gap={1}
									justifyContent={message.memberData?._id === user._id ? 'flex-end' : 'flex-start'}
									sx={{ my: 1 }}
								>
									{message.memberData?._id !== user._id && <Avatar src={imageUrl(message.memberData?.memberImage)} />}
									<div className={message.memberData?._id === user._id ? 'msg-right' : 'msg-left'}>{message.text}</div>
								</Stack>
							))}
						</Stack>
					</ScrollableFeed>
				</div>
				<div className="chat-bott">
					<input
						aria-label={t('Chat xabari')}
						className="msg-input"
						placeholder={connected ? t('Xabar yozing') : t('Chatga ulanilmoqda…')}
						disabled={!connected}
						value={input}
						maxLength={1000}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter') send();
						}}
					/>
					<button
						className="send-msg-btn"
						aria-label={t('Xabar yuborish')}
						disabled={!connected || !input.trim()}
						onClick={send}
					>
						<SendIcon />
					</button>
				</div>
			</Stack>
		</Stack>
	);
}
