import React, { useEffect, useRef, useState } from 'react';
import './Home.css';
import IMessage from '../../utils/IMessage';
import cryptoJs from 'crypto-js';

const typeByElement = new Map<string, (message: IMessage) => JSX.Element>([
	['text', (message: IMessage) => <div>{message.content}</div>],
	['image/url', (message: IMessage) => <img src={message.content} alt={message.content} />],
	['image/base64', (message: IMessage) => <img src={message.content} alt={message.content} />],
]);

function encrypt(message: string, secretKey: string): string {
	const aes = cryptoJs.AES.encrypt(message, secretKey).toString();
	const des = cryptoJs.TripleDES.encrypt(aes, secretKey).toString();
	return des;
}

function decrypt(message: string, secretKey: string): string {
	const des = cryptoJs.TripleDES.decrypt(message, secretKey).toString(cryptoJs.enc.Utf8);
	const aes = cryptoJs.AES.decrypt(des, secretKey).toString(cryptoJs.enc.Utf8);
	return aes;
}

function Home() {
	const [messages, setMessages] = useState([
		{
			objectId: '1',
			content:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent dapibus dapibus mauris non tempus. Curabitur ut sagittis leo. Suspendisse quis lobortis diam, egestas condimentum nibh. Nulla lobortis ac felis ut eleifend. Nam ac quam interdum nisl gravida luctus ac at lacus. Sed vulputate accumsan mi a euismod. Nulla facilisi. Nulla.',
			type: 'text',
			author: 'author 1',
		},
		{
			objectId: '2',
			content:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent dapibus dapibus mauris non tempus. Curabitur ut sagittis leo. Suspendisse quis lobortis diam, egestas condimentum nibh. Nulla lobortis ac felis ut eleifend. Nam ac quam interdum nisl gravida luctus ac at lacus. Sed vulputate accumsan mi a euismod. Nulla facilisi. Nulla.',
			type: 'text',
			author: 'author 2',
		},
		{
			objectId: '3',
			content:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent dapibus dapibus mauris non tempus. Curabitur ut sagittis leo. Suspendisse quis lobortis diam, egestas condimentum nibh. Nulla lobortis ac felis ut eleifend. Nam ac quam interdum nisl gravida luctus ac at lacus. Sed vulputate accumsan mi a euismod. Nulla facilisi. Nulla.',
			type: 'text',
			author: 'author 1',
		},
		{
			objectId: '4',
			content:
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent dapibus dapibus mauris non tempus. Curabitur ut sagittis leo. Suspendisse quis lobortis diam, egestas condimentum nibh. Nulla lobortis ac felis ut eleifend. Nam ac quam interdum nisl gravida luctus ac at lacus. Sed vulputate accumsan mi a euismod. Nulla facilisi. Nulla.',
			type: 'text',
			author: 'author 3',
		},
	] as Array<IMessage>);

	const messageRef = useRef(undefined as any);
	const authorRef = useRef(undefined as any);
	const secretKeyRef = useRef(undefined as any);
	const messageContentRef = useRef(undefined as any);

	function getSecretKey(): string | undefined {
		if (secretKeyRef === undefined || secretKeyRef.current === undefined || secretKeyRef.current.value === '') return undefined;

		return secretKeyRef.current.value;
	}

	function getAuthor(): string {
		if (authorRef === undefined || authorRef.current === undefined || authorRef.current.value === '') return 'Anonymous';

		return authorRef.current.value;
	}

	function getMessage(): string | undefined {
		if (messageRef === undefined || messageRef.current === undefined) return undefined;

		return messageRef.current.value;
	}

	function createElementMessage(message: IMessage) {
		const action = typeByElement.get(message.type);

		if (action === undefined) return;

		return action(message);
	}

	function sendMessage() {
		const message = getMessage();
		let content = message;
		if (message === undefined) return;

		const author = getAuthor();
		const secretKey = getSecretKey();

		if (secretKey !== undefined) content = encrypt(message, secretKey);

		console.log(content);

		// Send message to backend

		setMessages([
			...messages,
			{ objectId: cryptoJs.SHA256(message + Date.now().toString()).toString(), content: message, type: 'text', author: 'you' },
		]);
	}

	function clearScreen() {
		setMessages([]);
	}

	useEffect(() => {
		const messageContent = messageContentRef.current;

		if (messageContent === undefined) return;

		messageContent.scrollTop = messageContent.scrollHeight;
	}, [messages]);

	return (
		<main>
			<section ref={messageContentRef} id="message-content">
				{messages.map((message: IMessage) => {
					return (
						<div key={message.objectId} className={`message-content-item ${message.author === 'you' ? 'my-message' : ''}`}>
							<div className="message-content-item-author">
								<span className={`w3-tag w3-round ${message.author === 'you' ? 'w3-green' : 'w3-red'}`}>{message.author}</span>
							</div>
							<div className={`w3-card w3-round w3-padding ${message.author === 'you' ? 'w3-black' : 'w3-white'}`}>
								{createElementMessage(message)}
							</div>
						</div>
					);
				})}
			</section>
			<section id="message-input">
				<div id="message-input-infos">
					<input ref={authorRef} className="w3-input w3-border" placeholder="Anonymous" type="text" />
					<input ref={secretKeyRef} className="w3-input w3-border" placeholder="Secret key (Optional)" type="password" />
				</div>
				<textarea ref={messageRef} className="w3-input w3-border" placeholder="Type a message" />
				<div id="message-input-buttons">
					<button onClick={() => sendMessage()} className="w3-button w3-black w3-round w3-hover-white">
						Send
					</button>
					<button onClick={() => clearScreen()} className="w3-button w3-white w3-round w3-hover-black">
						Clear Screen
					</button>
				</div>
			</section>
		</main>
	);
}

export default Home;
