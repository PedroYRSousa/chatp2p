import React, { useEffect, useRef, useState } from 'react';
import './Home.css';
import IMessage from '../../utils/IMessage';
import cryptoJs from 'crypto-js';
import Parse from 'parse';
import { useParseQuery } from '@parse/react';

const PARSE_APPLICATION_ID = 'q8MXrH8P7iigUDTCNA84Cyhb9DSpGThGh6WHwYW0';
const PARSE_HOST_URL = 'https://chatp2p.b4a.io';
const PARSE_JAVASCRIPT_KEY = 'Jz5Rx1fPh8NgO9PPIJNLhtgr2178K8ewfloZcHi4';
Parse.initialize(PARSE_APPLICATION_ID, PARSE_JAVASCRIPT_KEY);
Parse.serverURL = PARSE_HOST_URL;
Parse.enableLocalDatastore();

const date = new Date();
const myId = cryptoJs.SHA256(window.crypto.getRandomValues(new Uint32Array(1))[0].toString() + Date.now().toString()).toString();

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
	let messages: Array<IMessage> = [];

	const messageRef = useRef(undefined as any);
	const authorRef = useRef(undefined as any);
	const secretKeyRef = useRef(undefined as any);
	const messageContentRef = useRef(undefined as any);

	const parseQuery = new Parse.Query('Message');
	parseQuery.ascending('createdAt');
	parseQuery.includeAll();
	parseQuery.greaterThanOrEqualTo('createdAt', date);
	const { isLive, isLoading, isSyncing, results, count, error, reload } = useParseQuery(parseQuery, {
		enableLocalDatastore: true,
		enableLiveQuery: true,
	});
	const res = results
		?.sort((a: any, b: any) => a.get('createdAt') - b.get('createdAt'))
		.map((result: any) => {
			const objectId = result.get('objectId');
			const author = result.get('author');
			const type = result.get('type');
			const content = result.get('content');
			const identify = result.get('identify');

			return { objectId, content, type, author, identify };
		});
	if (res !== undefined) {
		messages = [...messages, ...res];
	}

	const sendMessageToBackEnd = async (message: IMessage) => {
		try {
			const { author, content, type } = message;

			let Message = new Parse.Object('Message');
			Message.set('content', content);
			Message.set('author', author);
			Message.set('type', type);
			Message.set('identify', myId);
			await Message.save();

			messageRef.current.value = '';
		} catch (error) {
			alert(error);
		}
	};

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
		if (content === undefined) return;

		const author = getAuthor();
		const secretKey = getSecretKey();

		if (secretKey !== undefined) content = encrypt(message, secretKey);

		// Send message to backend
		sendMessageToBackEnd({
			author,
			content,
			identify: myId,
			objectId: '',
			type: 'text',
		});

		messages = [
			...messages,
			{ objectId: cryptoJs.SHA256(message + Date.now().toString()).toString(), content: message, type: 'text', author: 'you', identify: myId },
		];
	}

	function clearScreen() {
		messages = [];
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
						<div key={message.objectId} className={`message-content-item ${message.identify === myId ? 'my-message' : ''}`}>
							<div className="message-content-item-author">
								<span className={`w3-tag w3-round ${message.identify === myId ? 'w3-green' : 'w3-red'}`}>{message.author}</span>
							</div>
							<div className={`w3-card w3-round w3-padding ${message.identify === myId ? 'w3-black' : 'w3-white'}`}>
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
