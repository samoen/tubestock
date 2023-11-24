import * as Utils from "$lib/utils";
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import * as Schema from '$lib/server/schema';
import * as Uuid from 'uuid'
import { eq } from "drizzle-orm";

 
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

try{
	let r = await migrate(db, { migrationsFolder: './drizzle' });
}catch(e){
	console.log('failed to migrate ' + String(e))
}

// export type AppUser = {
// 	id: string;
// 	displayName: string;
// 	secret: string;
// 	publicId: string;
// 	idleStock: number;
// }

// export type TuberInDb = {
// 	id:string,
//     channelName: string,
//     channelId: string,
//     count: number,
//     countUpdatedAt: number,
// }

export type UserInMemory = {
	dbId:number;
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
	// usersInDb: Schema.AppUser[]
	usersInMemory: UserInMemory[]
	// msgs: Utils.SavedChatMsg[]
	// tubers: TuberInDb[]
	// positions: Utils.Position[]
}
export const state: ServerAppState = {
	// usersInDb: [],
	usersInMemory: [],
	// msgs: [],
	// tubers: [],
	// positions:[]
}

export async function usersOnServerToClient():Promise< Utils.OtherUserOnClient[]>{
	const dbUsers = await dbGetAllUsers()

	const usersOnClient: Utils.OtherUserOnClient[] = []

	for(const dbusr of dbUsers){
		const usrPoses = await dbGetPositionsForUser(dbusr.id)
		const posesOnClient = await positionArrayToPosWithReturnValArray(usrPoses)
		const onClient: Utils.OtherUserOnClient = {
			displayName: dbusr.displayName,
			publicId: dbusr.publicId,
			idleStock: dbusr.idleStock,
			positions: posesOnClient,
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

export async function broadcastEveryoneWorld(){
	const usrsOnClient = await usersOnServerToClient()
	for (const memUser of state.usersInMemory) {
        if (!memUser.con) continue
		const dbUser = await dbGetUserByPrimaryKey(memUser.dbId)
		if(!dbUser)continue
		const poses = await dbGetPositionsForUser(dbUser.id)
		const allTubers = await dbGetAllTubers()
		const msgsOnClient = await messagesToClient()
		const posesOnClient = await positionArrayToPosWithReturnValArray(poses)
        const worldEvent: Utils.WorldEvent = {
            tubers: allTubers,
            positions: posesOnClient,
			msgs: msgsOnClient,
			users: usrsOnClient,
			yourIdleStock:dbUser.idleStock,
			yourPrivateId:dbUser.secret,
			yourName:dbUser.displayName,
        }
        sendToUser(memUser, 'world', worldEvent)
    }
	removeClosedConnections()
}

export async function messagesToClient(){
	const msgs = await dbGetAllMsgs()
		const msgsOnClient = msgs.map(m=>{
			const cMsg : Utils.ChatMsgOnClient = {
				msgId:m.id,
				fromUserName:m.fromUsername,
				msgTxt:m.msgTxt
			}
			return cMsg
		})
	return msgsOnClient
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
export async function calcReturnValue(pos: Schema.DbPosition): Promise< number | undefined> {
	// const foundTuber = state.tubers.findLast(t => t.channelId == pos.tuberId)
	const foundTuber = await dbGetTuberByPrimaryKey(pos.tuberfk)
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
export async function positionToPosWithReturnVal(pos: Schema.DbPosition): Promise<(Schema.DbPosition & {returnValue:number}) | undefined> {
	const val = await calcReturnValue(pos)
	if (val == undefined) return undefined
	const posWithValue = {		
		...pos,
		returnValue: val,
	}
	return posWithValue
}
export async function positionArrayToPosWithReturnValArray(poses: Schema.DbPosition[]): Promise<Utils.PositionInClient[]> {
	const result: Utils.PositionInClient[] = []
	for (const pos of poses) {
		const withRet = await positionToPosWithReturnVal(pos)
		if (withRet == undefined) continue
		result.push(withRet)
	}
	return result
}

export async function checkUpdateCount(tuber: Schema.DbTuber): Promise<boolean> {
	let testing = true
	if (testing) {
		const newCount = tuber.count + 500000
		const newAt = new Date().getTime()
		dbUpdateTuberCountByPKey(tuber.id, newCount, newAt)
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
	dbUpdateTuberCountByPKey(tuber.id,fetchedCount,today)
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

export async function dbDeletePositionById(id:number){
	await db.delete(Schema.positions).where(eq(Schema.positions.id,id))
	// state.positions = state.positions.filter(p => p.id !== id)
}

export async function dbGetPositionsForUser(usrPrimKey:number): Promise<Schema.DbPosition[]>{
	let selected = await db.select().from(Schema.positions).where(eq(Schema.positions.userfk,usrPrimKey))
	return selected
	// return state.positions.filter(p=>p.userfk == usrPrimKey)

}

export async function dbGetAllTubers():Promise<Schema.DbTuber[]>{
	return db.query.tubers.findMany()
}

export async function dbGetUserByPrivateId(pId:string): Promise<Schema.AppUser | undefined>{
	// let usr = state.usersInDb.findLast(u => u.secret == pId);
	// let usr = await db.query.appusers.findFirst({where:{secret:pId}});
	const usrs = await db.select().from(Schema.appusers).where(eq(Schema.appusers.secret,pId));
	const usr = usrs.at(0)
	return usr
}

export async function dbGetAllUsers(): Promise<Schema.AppUser[]>{
	// let selected = await db.select().from(Schema.appusers)
	let found = await db.query.appusers.findMany()
	return found
	// return state.usersInDb
}

export async function dbGetTuberByPrimaryKey(tuberPKey:number): Promise<Schema.DbTuber | undefined>{
	let selected = await db.select().from(Schema.tubers).where(eq(Schema.tubers.id,tuberPKey))
	let t = selected.at(0)
	return t
	// return state.tubers.findLast(t => t.channelId == pos.tuberId)
	// return state.tubers.findLast(t => t.id == tuberPKey)
}
export async function dbGetTuberByChannelId(chanId:string):Promise<Schema.DbTuber | undefined>{
	let selected = await db.select().from(Schema.tubers).where(eq(Schema.tubers.channelId,chanId))
	let t = selected.at(0)
	return t
	// return state.tubers.findLast(t=>t.channelId == chanId)
}
export async function dbGetTuberByChannelName(chanName:string):Promise<Schema.DbTuber | undefined>{
	let selected = await db.select().from(Schema.tubers).where(eq(Schema.tubers.channelName,chanName))
	let t = selected.at(0)
	return t
	// return state.tubers.findLast(t=>t.channelName == chanName)
}
export async function dbInsertTuber(tuber:Schema.InsertDbTuber){
	await db.insert(Schema.tubers).values(tuber)
	// let tuberInDb : TuberInDb = {
	// 	id: Uuid.v4(),
	// 	...tuber
	// }
	// state.tubers.push(tuberInDb)
}

export async function dbUpdateTuberCountByPKey(pKey:number,count:number,at:number){
	await db.update(Schema.tubers).set({count:count,countUpdatedAt:at}).where(eq(Schema.tubers.id,pKey))
	// const tuber = state.tubers.findLast(t=>t.id == pKey)
	// if(tuber){
	// 	tuber.count = count
	// 	tuber.countUpdatedAt = at
	// }
}

export async function dbGetUserByPrimaryKey(pKey:number) : Promise<Schema.AppUser | undefined>{
	const dbUsers = await db.select().from(Schema.appusers).where(eq(Schema.appusers.id,pKey))
	const dbUser = dbUsers.at(0)
	// const dbUser = state.usersInDb.findLast(u=>u.id == pKey)
	return dbUser
}

export async function dbDeleteUser(pKey:number){
	await db.delete(Schema.appusers).where(eq(Schema.appusers.id, pKey))
	// Utils.findRunRemove(
    //     state.usersInDb,
    //     (u) => u.id == pKey,
    //     (u) => {
    //         console.log(`user ${u.displayName} removed from db`)
    //     },
    // )
}
// export type UserCreateProps = {
// 	privateId:string;
// 	displayName: string;
// }
export type UserCreateProps = Pick<Schema.AppUser,'displayName'|'secret'>

export async function dbInsertUser(usrCreate:Schema.InsertAppUser): Promise<Schema.AppUser>{

	// let dbUsr : Schema.AppUser = {
	// 	id:Uuid.,
	// 	publicId: Uuid.v4(),
	// 	idleStock:100,
	// 	...usrCreate
	// }
	// state.usersInDb.push(dbUsr)

	const ret = await db.insert(Schema.appusers).values(usrCreate).returning()
	const dbUsr = ret.at(0)
	if(!dbUsr)throw ' huh'
	return dbUsr 
}

export async function dbInsertPosition(posCreate:Schema.InsertDbPosition):Promise<Schema.DbPosition>{
	// state.positions.push(dbPosition)
	const ret = await db.insert(Schema.positions).values(posCreate).returning()
	const dbPos = ret.at(0)
	if(!dbPos)throw ' huh'
	return dbPos 
}

export async function dbGetAllMsgs():Promise<Schema.DbChatMsg[]>{
	// return state.msgs
	let selected = await db.select().from(Schema.chatMessages)
	return selected
}
export async function dbInsertMsg(msg:Schema.InsertDbChatMsg){
	// state.msgs.push(msg)
	const inserted = await db.insert(Schema.chatMessages).values(msg).returning()
	const fInserted = inserted.at(0)
	return fInserted
}