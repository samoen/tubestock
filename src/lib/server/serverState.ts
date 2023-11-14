import type * as Utils from "$lib/utils";

export type User = {
    uid:string;
    displayName:string;
    con: ReadableStreamController<unknown> | undefined;
	stream: ReadableStream | undefined;
}
type AppState = {
	users : User[]
	msgs : Utils.SavedChatMsg[]

}
export const state : AppState = {
	users: [],
	msgs: []
}

export function broadcastUserSentMessage(chatMsg:Utils.ChatMsgBroadcast){
	console.log('broadcast chatmsg to users: ' + state.users.length + 'online: ' + state.users.filter(u=>u.con).length)
    for (const user of state.users) {
		if (user.stream && user.con) {
			// const toSend : UpdateFromServer = {
            //     newMsg: msgs.at(-1)
            // };
			let fail = false;
			try {
                console.log('enquing to users ' + JSON.stringify(chatMsg))
				user.con.enqueue(encode(`chatmsg`, chatMsg));
			} catch (e) {
				console.log(user.displayName + ' failed to enqeue ' + e);
				fail = true;
			}
			if (fail) {
				try {
					user.con?.close();
				} catch (e) {
					console.log('failed to enque and failed to close!');
				}
				try {
					// user.connectionState.stream?.cancel()
				} catch (e) {
					console.log('failed to enque and failed to cancel stream!');
				}
				user.con = undefined;
				user.stream = undefined;
			}
		}
	}
}

export function broadcastUserJoined(joined:User){
    console.log('broadcast user joined to users: ' + state.users.length + 'online: ' + state.users.filter(u=>u.con).length)
    for (const user of state.users) {
		if (user.stream && user.con) {
			const toSend : Utils.UserJoined = {
                joinedUserName: joined.displayName,
            };
			let fail = false;
			try {
                console.log('enquing to users ' + JSON.stringify(toSend))
				user.con.enqueue(encode(`userJoined`, toSend));
			} catch (e) {
				console.log(user.displayName + ' failed to enqeue ' + e);
				fail = true;
			}
			if (fail) {
				try {
					user.con?.close();
				} catch (e) {
					console.log('failed to enque and failed to close!');
				}
				try {
					// user.connectionState.stream?.cancel()
				} catch (e) {
					console.log('failed to enque and failed to cancel stream!');
				}
				user.con = undefined;
				user.stream = undefined;
			}
		}
	}
}

const textEncoder = new TextEncoder();
export function encode(event: string, data: object, noretry = false) {
	let toEncode = `event:${event}\ndata: ${JSON.stringify(data)}\n`;
	if (noretry) {
		toEncode = toEncode + `retry: -1\n`;
	}
	toEncode = toEncode + `\n`;
	return textEncoder.encode(toEncode);
}