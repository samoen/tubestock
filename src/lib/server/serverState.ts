import * as Utils from "$lib/utils";

export type UserOnServer = {
	uid: string;
	publicId: string;
	displayName: string;
	con: ReadableStreamController<unknown> | undefined;
	stream: ReadableStream | undefined;
	idleStock: number;
	positions: Utils.Position[]
}

const USE_FAKE_LATENCY = true
export async function fakeLatency(){
	if(import.meta.env.MODE == 'development' && USE_FAKE_LATENCY){
		await new Promise(r=>setTimeout(r,700))
	}
}


// export function createUser(){

// }

// export type Tuber = {
// 	channelName:string,
// 	channelId:string,
// 	lastSubCount:number,
// }

type AppState = {
	users: UserOnServer[]
	msgs: Utils.SavedChatMsg[]
	tubers: Utils.Tuber[]
}
export const state: AppState = {
	users: [],
	msgs: [],
	tubers: [],
}

export function usersOnServerToClient():Utils.UserOnClient[]{
	const usersOnClient: Utils.UserOnClient[] = state.users.map(u => {
		const onClient: Utils.UserOnClient = {
			displayName: u.displayName,
			publicId: u.publicId,
		}
		return onClient
	})
	return usersOnClient
}

export function broadcast(event: string, data: object) {
	for (const user of state.users) {
		if (user.stream && user.con) {
			let fail = false;
			try {
				user.con.enqueue(encode(event, data));
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


export function sendToUser(user: UserOnServer, payload: Utils.WelcomeSubscriber) {
	const con = user.con
	if (!con) return
	const res = Utils.runCatching(()=>{
		con.enqueue(encode('welcomeSubscriber', payload));
	})
	if(res.failed){
		console.log(user.displayName + ' failed to enqeue');
		Utils.runCatching(()=>con.close())
		user.con = undefined;
		user.stream = undefined;
	}
}

export function broadcastUserSentMessage(chatMsg: Utils.ChatMsgBroadcast) {
	broadcast('chatmsg', chatMsg)
}

export function broadcastUserJoined(joined: UserOnServer) {
	const toSend: Utils.UserOnClient = {
		displayName: joined.displayName,
		publicId: joined.publicId
	};
	broadcast('userJoined', toSend)
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
export function calcReturnValue(pos: Utils.Position): number | undefined {
	const foundTuber = state.tubers.findLast(t => t.channelId == pos.tuberId)
	if (!foundTuber) return undefined

	const subsGained = foundTuber.count - pos.subsAtStart
	const percentGain = subsGained / pos.subsAtStart
	let bonus = Math.floor(pos.amount * percentGain)
	if (!pos.long) {
		bonus = bonus * -1
	}
	return bonus
}
export function positionToPosWithReturnVal(pos: Utils.Position): Utils.PositionWithReturnValue | undefined {
	const val = calcReturnValue(pos)
	if (val == undefined) return undefined
	const posWithValue: Utils.PositionWithReturnValue = {
		...pos,
		returnValue: val,
	}
	return posWithValue
}
export function positionArrayToPosWithReturnValArray(poses: Utils.Position[]): Utils.PositionWithReturnValue[] {
	const result: Utils.PositionWithReturnValue[] = []
	for (const pos of poses) {
		const withRet = positionToPosWithReturnVal(pos)
		if (withRet == undefined) continue
		result.push(withRet)
	}
	return result
}
export async function checkUpdateCount(tuber: Utils.Tuber): Promise<boolean> {
	let testing = true
	if (testing) {
		tuber.count = tuber.count - 500000
		tuber.countUpdatedAt = new Date().getTime()
		return true
	}

	const updatedAtPlusADay = tuber.countUpdatedAt + 80000000
	const today = new Date().getTime()
	if (today < updatedAtPlusADay) {
		return false
	}
	const fetchedCount = await fetchTuberSubsFromId(tuber.channelId)
	if (fetchedCount == undefined) {
		return false
	}
	tuber.count = fetchedCount
	tuber.countUpdatedAt = today
	return true
}

export async function fetchTuberSubsFromId(id: string): Promise<number | undefined> {
	const usrfetched = await fetch(
		`https://mixerno.space/api/youtube-channel-counter/user/${id}`,
		{
			headers: {
				'Accept': 'application/json',

			}
		}
	)
	if (!usrfetched.ok) {
		return undefined
	}

	let usrTxt = await usrfetched.json()
	let count: number | undefined = undefined
	try {
		count = usrTxt['counts'][0]['count']
	} catch (e) {
		console.log('failed to get count from mixerno')
	}
	if (count == undefined || typeof count !== 'number') {
		return undefined
	}

	return count
}