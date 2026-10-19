import { useText } from '../i18n';
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useReactiveVar } from '@apollo/client';
import { Avatar, IconButton, Stack } from '@mui/material';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ScrollableFeed, { ScrollableFeedProps } from 'react-scrollable-feed';
import { socketVar, userVar, sessionVar } from '../../apollo/store';
import { getJwtToken, restoreSession } from '../auth';
import { imageUrl } from '../feedback';
import { ChatMessage, readChatMessage } from '../chat';

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'paused';
const ChatFeed = ScrollableFeed as React.ComponentType<React.PropsWithChildren<ScrollableFeedProps>>;
export default function Chat() {
	const { t, locale } = useText();
	const user = useReactiveVar(userVar);
	const session = useReactiveVar(sessionVar);
	const token = session.status === 'authenticated' ? getJwtToken() : '';
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [online, setOnline] = useState(0);
	const [input, setInput] = useState('');
	const [open, setOpen] = useState(false);
	const [status, setStatus] = useState<ConnectionStatus>('connecting');
	const [clientId, setClientId] = useState('');
	const [error, setError] = useState('');
	const [retry, setRetry] = useState(0);
	const launcherRef = useRef<HTMLButtonElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const socket = useReactiveVar(socketVar);
	const connected = status === 'connected';
	useEffect(() => {
		setMessages([]);
		setInput('');
		setError('');
	}, [token, user._id, session.status]);
	useEffect(() => {
		setOnline(0);
		setClientId('');
		if (session.status === 'loading' || session.status === 'error') {
			setStatus('paused');
			return;
		}
		let disposed = false;
		let connection: WebSocket | undefined;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let attempts = 0;
		const reconnect = () => {
			if (disposed) return;
			setStatus('reconnecting');
			timer = setTimeout(connect, Math.min(1000 * 2 ** Math.min(attempts++, 4), 15000));
		};
		function connect() {
			if (disposed) return;
			setStatus(attempts ? 'reconnecting' : 'connecting');
			try {
				const url = new URL(process.env.REACT_APP_API_WS || 'ws://localhost:3007');
				if (token) url.searchParams.set('token', token);
				const current = new WebSocket(url.toString());
				connection = current;
				socketVar(current);
				current.onopen = () => {
					if (disposed || connection !== current) return;
					attempts = 0;
					setStatus('connected');
					setError('');
				};
				current.onclose = () => {
					if (disposed || connection !== current) return;
					setOnline(0);
					setClientId('');
					if (socketVar() === current) socketVar(undefined);
					reconnect();
				};
				current.onerror = () => {
					if (!disposed && connection === current) setStatus('reconnecting');
				};
				current.onmessage = (event) => {
					if (disposed || connection !== current) return;
					try {
						const data = JSON.parse(event.data);
						if (data.event === 'connected' && typeof data.clientId === 'string') setClientId(data.clientId);
						else if (data.event === 'info' && Number.isInteger(data.totalClients) && data.totalClients >= 0)
							setOnline(data.totalClients);
						else if (data.event === 'getMessages' && Array.isArray(data.list))
							setMessages(
								data.list
									.map(readChatMessage)
									.filter((message: ChatMessage | null): message is ChatMessage => Boolean(message))
									.slice(-50),
							);
						else if (data.event === 'message') {
							const message = readChatMessage(data);
							if (message)
								setMessages((list) =>
									message.id && list.some((item) => item.id === message.id) ? list : [...list, message].slice(-50),
								);
						} else if (data.event === 'chatError') {
							setError(
								data.code === 'CHAT_AUTH_REQUIRED'
									? 'Chat sessiyasi tugagan. Qayta kiring.'
									: 'Xabar yuborilmadi. Qayta urinib ko‘ring.',
							);
							if (data.code === 'CHAT_AUTH_REQUIRED') window.dispatchEvent(new Event('quwat:session-check'));
						}
					} catch {
						/* Ignore malformed and unrelated socket messages. */
					}
				};
			} catch {
				reconnect();
			}
		}
		connect();
		return () => {
			disposed = true;
			clearTimeout(timer);
			if (connection) {
				connection.onopen = null;
				connection.onclose = null;
				connection.onmessage = null;
				connection.onerror = null;
				connection.close();
				if (socketVar() === connection) socketVar(undefined);
			}
		};
	}, [token, user._id, session.status, retry]);
	useEffect(() => {
		if (open) inputRef.current?.focus();
	}, [open]);
	function close() {
		setOpen(false);
		launcherRef.current?.focus();
	}
	function send() {
		const text = input.trim();
		if (!text || text.length > 1000 || !connected || !socket || socket.readyState !== WebSocket.OPEN) return;
		try {
			socket.send(JSON.stringify({ event: 'message', data: text }));
			setInput('');
			setError('');
		} catch {
			setError('Xabar yuborilmadi. Qayta urinib ko‘ring.');
		}
	}
	const stateText = connected
		? t('Onlayn: {{count}}', { count: online })
		: status === 'paused'
		? t('Chat vaqtincha mavjud emas')
		: t(status === 'reconnecting' ? 'Qayta ulanilmoqda…' : 'Chatga ulanilmoqda…');
	return (
		<Stack className="chatting">
			<button
				ref={launcherRef}
				type="button"
				className="chat-button"
				aria-label={open ? t('Chatni yopish') : t('Chatni ochish')}
				aria-expanded={open}
				aria-controls={open ? 'quwat-chat-panel' : undefined}
				onClick={() => (open ? close() : setOpen(true))}
			>
				{open ? <CloseRoundedIcon /> : <ChatBubbleOutlineRoundedIcon />}
				{!open && <span className={`quwat-chat-status-dot ${connected ? 'online' : ''}`} aria-hidden="true" />}
			</button>
			{open && (
				<section
					id="quwat-chat-panel"
					className="chat-frame open"
					role="dialog"
					aria-modal="false"
					aria-labelledby="quwat-chat-title"
					onKeyDown={(event) => {
						if (event.key === 'Escape') {
							event.preventDefault();
							close();
						}
					}}
				>
					<header className="chat-top">
						<Image src="/img/logo/logoText.svg" alt="" width={36} height={36} />
						<div className="quwat-chat-heading">
							<h2 id="quwat-chat-title">{t('Quwat chat')}</h2>
							<span className="quwat-chat-connection" role="status">
								<i className={connected ? 'online' : ''} />
								{stateText}
							</span>
						</div>
						<IconButton aria-label={t('Chatni yopish')} onClick={close}>
							<CloseRoundedIcon />
						</IconButton>
					</header>
					<p className="quwat-chat-room-note">{t('Umumiy chat — xabarlar barcha ishtirokchilarga ko‘rinadi.')}</p>
					{!connected && (
						<div className="quwat-chat-retry">
							<span>{t('Ulanish tiklangach xabar yuborishingiz mumkin.')}</span>
							<button
								type="button"
								onClick={() => (session.status === 'error' ? void restoreSession() : setRetry((value) => value + 1))}
							>
								{t('Qayta ulanish')}
							</button>
						</div>
					)}
					<div className="chat-content">
						<ChatFeed className="quwat-chat-feed">
							<div
								className="chat-main"
								role="log"
								aria-label={t('Chat xabarlari')}
								aria-live="polite"
								aria-relevant="additions"
							>
								{!messages.length && (
									<div className="quwat-chat-empty">
										<ChatBubbleOutlineRoundedIcon />
										<strong>{t('Quwat chatiga xush kelibsiz!')}</strong>
										<span>{t('Suhbatni birinchi bo‘lib boshlang.')}</span>
									</div>
								)}
								{messages.map((message, index) => {
									const own =
										Boolean(message.memberData?._id && message.memberData._id === user._id) ||
										Boolean(clientId && message.senderId === clientId);
									const name = message.memberData?.memberNick || t('Mehmon');
									return (
										<div key={message.id || index} className={`quwat-chat-message ${own ? 'own' : ''}`}>
											{!own && <Avatar src={imageUrl(message.memberData?.memberImage)} alt={name} />}
											<div className="quwat-chat-bubble">
												<span className="quwat-chat-author">{own ? t('Siz') : name}</span>
												<p>{message.text}</p>
												{message.createdAt && (
													<time dateTime={message.createdAt}>
														{new Date(message.createdAt).toLocaleTimeString(locale, {
															hour: '2-digit',
															minute: '2-digit',
														})}
													</time>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</ChatFeed>
					</div>
					{error && (
						<div className="quwat-chat-error" role="alert">
							{t(error)}
						</div>
					)}
					<form
						className="chat-bott"
						onSubmit={(event) => {
							event.preventDefault();
							send();
						}}
					>
						<input
							ref={inputRef}
							aria-label={t('Chat xabari')}
							className="msg-input"
							placeholder={t('Xabar yozing')}
							value={input}
							maxLength={1000}
							onChange={(event) => setInput(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault();
							}}
						/>
						<button
							type="submit"
							className="send-msg-btn"
							aria-label={t('Xabar yuborish')}
							disabled={!connected || !input.trim()}
						>
							<SendRoundedIcon />
						</button>
					</form>
				</section>
			)}
		</Stack>
	);
}
