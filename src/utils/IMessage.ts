export default interface IMessage {
	objectId: string;
	type: string;
	content: string;
	author: string;
	identify: string;
	encrypted: boolean | undefined;
}
