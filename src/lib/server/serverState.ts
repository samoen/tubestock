import * as Utils from "$lib/utils";
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import * as Schema from '$lib/server/schema';
import * as Uuid from 'uuid'
 
const client = new Client({
  host: "127.0.0.1",
  port: 5432,
  user: "postgres",
  password: "password",
  database: "tubestock",
});
 
await client.connect();
export const db = drizzle(client,{ schema:Schema });
process.on('exit',()=>{
	console.log('server exit')
	client.end()
})
process.on('SIGINT',()=>{
	console.log('server SIGINT')
	client.end()
})

export type UserInDb = {
	pKey: string;
	privateId: string;
	publicId: string;
	displayName: string;
	idleStock: number;
}

export type TuberInDb = {
	pKey:string,
    channelName: string,
    channelId: string,
    count: number,
    countUpdatedAt: number,
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
	tubers: TuberInDb[]
	positions: Utils.Position[]
}
export const state: ServerAppState = {
	usersInDb: [],
	usersInMemory: [],
	msgs: [],
	tubers: [],
	positions:[]
}

export function usersOnServerToClient():Utils.OtherUserOnClient[]{
	const dbUsers = dbGetAllUsers()

	const usersOnClient: Utils.OtherUserOnClient[] = []

	for(const dbusr of dbUsers){
		const usrPoses = dbGetPositionsForUser(dbusr.pKey)
		const onClient: Utils.OtherUserOnClient = {
			displayName: dbusr.displayName,
			publicId: dbusr.publicId,
			idleStock: dbusr.idleStock,
			positions: positionArrayToPosWithReturnValArray(usrPoses)
		}
		usersOnClient.push(onClient)

	}
	
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
		const dbUser = dbGetUserByPrimaryKey(memUser.dbId)
		if(!dbUser)continue
		const poses = dbGetPositionsForUser(dbUser.pKey)
		const allTubers = dbGetAllTubers()
		const msgs = dbGetAllMsgs()
        const worldEvent: Utils.WorldEvent = {
            tubers: allTubers,
            positions: positionArrayToPosWithReturnValArray(poses),
			msgs: msgs,
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
	// const foundTuber = state.tubers.findLast(t => t.channelId == pos.tuberId)
	const foundTuber = dbGetTuberByPrimaryKey(pos.tuberfk)
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
export async function checkUpdateCount(tuber: TuberInDb): Promise<boolean> {
	let testing = true
	if (testing) {
		const newCount = tuber.count + 500000
		const newAt = new Date().getTime()
		dbUpdateTuberCountByPKey(tuber.pKey, newCount, newAt)
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
	dbUpdateTuberCountByPKey(tuber.pKey,fetchedCount,today)
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

export function dbDeletePositionById(id:string){
	state.positions = state.positions.filter(p => p.positionId !== id)
}

export function dbGetPositionsForUser(usrPrimKey:string):Utils.Position[]{
	return state.positions.filter(p=>p.userfk == usrPrimKey)
}

export function dbGetAllTubers():TuberInDb[]{
	return state.tubers
}

export function dbGetUserByPrivateId(pId:string):UserInDb | undefined{
	let usr = state.usersInDb.findLast(u => u.privateId == pId);
	return usr
}

export function dbGetAllUsers():UserInDb[]{
	return state.usersInDb
}

export function dbGetTuberByPrimaryKey(tuberPKey:string):TuberInDb | undefined{
	// return state.tubers.findLast(t => t.channelId == pos.tuberId)
	return state.tubers.findLast(t => t.pKey == tuberPKey)
}
export function dbGetTuberByChannelId(chanId:string):TuberInDb | undefined{
	return state.tubers.findLast(t=>t.channelId == chanId)
}
export function dbGetTuberByChannelName(chanName:string):TuberInDb | undefined{
	return state.tubers.findLast(t=>t.channelName == chanName)
}
export type TuberCreateProps = {
	channelName: string,
    channelId: string,
    count: number,
    countUpdatedAt: number,
}
export function dbInsertTuber(tuber:TuberCreateProps){
	let tuberInDb : TuberInDb = {
		pKey: Uuid.v4(),
		...tuber
	}
	state.tubers.push(tuberInDb)
}

export function dbUpdateTuberCountByPKey(pKey:string,count:number,at:number){
	const tuber = state.tubers.findLast(t=>t.pKey == pKey)
	if(tuber){
		tuber.count = count
		tuber.countUpdatedAt = at
	}
}

export function dbGetUserByPrimaryKey(pKey:string) : UserInDb | undefined{
	const dbUser = state.usersInDb.findLast(u=>u.pKey == pKey)
	return dbUser
}

export function dbDeleteUser(pKey:string){
	Utils.findRunRemove(
        state.usersInDb,
        (u) => u.pKey == pKey,
        (u) => {
            console.log(`user ${u.displayName} removed from db`)
        },
    )
}
export type UserCreateProps = {
	privateId:string;
	displayName: string;
}
export async function dbInsertUser(usrCreate:UserCreateProps): Promise<UserInDb>{
	let dbUsr : UserInDb = {
		pKey:Uuid.v4(),
		publicId: Uuid.v4(),
		idleStock:100,
		...usrCreate
	}
	state.usersInDb.push(dbUsr)
	return dbUsr
}

export function dbInsertPosition(dbPosition:Utils.Position){
	state.positions.push(dbPosition)
}

export function dbGetAllMsgs():Utils.SavedChatMsg[]{
	return state.msgs
}
export function dbInsertMsg(msg:Utils.SavedChatMsg){
	state.msgs.push(msg)
}