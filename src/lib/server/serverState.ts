import * as Utils from "$lib/utils";

export type UserInDb = {
	dbId: string;
	privateId: string;
	publicId: string;
	displayName: string;
	idleStock: number;
	positions: Utils.Position[]
}

export type UserInMemory = {
	dbId:string
	con: ReadableStreamController<unknown> | undefined;
	// stream: ReadableStream | undefined;
}

const USE_FAKE_LATENCY = true
export async function fakeLatency(){
	if(import.meta.env.MODE == 'development' && USE_FAKE_LATENCY){
		await new Promise(r=>setTimeout(r,700))
	}
}

type ServerAppState = {
	usersInDb: UserInDb[]
	usersInMemory: UserInMemory[]
	msgs: Utils.SavedChatMsg[]
	tubers: Utils.Tuber[]
}
export const state: ServerAppState = {
	usersInDb: [],
	usersInMemory: [],
	msgs: [],
	tubers: [],
}

export function usersOnServerToClient():Utils.OtherUserOnClient[]{
	const usersOnClient: Utils.OtherUserOnClient[] = state.usersInDb.map(u => {
		const onClient: Utils.OtherUserOnClient = {
			displayName: u.displayName,
			publicId: u.publicId,
			idleStock: u.idleStock,
			positions: positionArrayToPosWithReturnValArray(u.positions)
		}
		return onClient
	})
	return usersOnClient
}

export function broadcast(event: string, data: object) {
	for (const user of state.usersInMemory) {
		sendToUser(user,event,data)
	}
	removeClosedConnections()
}


export function sendToUser(user: UserInMemory, key:string, payload: object) {
	const con = user.con
	if (!con) return
	const res = Utils.runCatching(()=>{
		con.enqueue(encode(key, payload));
	})
	if(res.failed){
		console.log(' failed to enqeue');
		Utils.runCatching(()=>con.close())
		user.con = undefined;
	}
}

function removeClosedConnections(){
	state.usersInMemory = state.usersInMemory.filter(u=>u.con)
}

export function broadcastEveryoneWorld(){
	const usrsOnClient = usersOnServerToClient()
	for (const memUser of state.usersInMemory) {
        if (!memUser.con) continue
		const dbUser = state.usersInDb.findLast(u=>u.dbId == memUser.dbId)
		if(!dbUser)continue
        const worldEvent: Utils.WorldEvent = {
            tubers: state.tubers,
            positions: positionArrayToPosWithReturnValArray(dbUser.positions),
			msgs: state.msgs,
			users: usrsOnClient,
			yourIdleStock:dbUser.idleStock,
			yourPrivateId:dbUser.privateId,
			yourName:dbUser.displayName,
        }
        sendToUser(memUser, 'world', worldEvent)
    }
	removeClosedConnections()
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
	let ret = pos.amount + bonus
	if(ret < 0){
		ret = 0
	}
	return ret
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
		tuber.count = tuber.count + 500000
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