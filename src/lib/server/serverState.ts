import * as Utils from "$lib/utils";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as DbClient from '$lib/server/dbClient'
import * as Schema from '$lib/server/schema';
import { asc, desc, eq } from "drizzle-orm";
import * as DORM from "drizzle-orm"
import { env } from '$env/dynamic/private';
import * as Kit from '@sveltejs/kit'
import { unionAll } from "drizzle-orm/pg-core";



console.log('running serverstate')

export const db = drizzle(DbClient.client, { schema: Schema });
try {
	await migrate(db, { migrationsFolder: './drizzle' });
} catch (e) {
	console.log('failed to migrate ' + String(e))
	process.exit()
}

export type UserInMemory = {
	dbId: number;
	con: ReadableStreamController<unknown> | undefined;
	// stream: ReadableStream | undefined;
}

const USE_FAKE_LATENCY = true
export async function fakeLatency() {
	if (import.meta.env.MODE == 'development' && USE_FAKE_LATENCY) {
		await new Promise(r => setTimeout(r, 700))
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

export async function betterUsersOnServerToClient(): Promise<Utils.OtherUserOnClient[]> {

	const selected = await db.query.appusers.findMany({
		columns: {
			id: true,
			displayName: true,
			idleStock: true
		},
		with: {
			positions: {
				columns: {
					tuberfk: false,
					userfk: false
				},
				with: {
					forTuber: {
						columns: {
							count: true
						}
					}
				}
			},
		},
	});

	const otherUsers: Utils.OtherUserOnClient[] = []
	for (const sel of selected) {

		const posesInClient: Utils.PositionInClient[] = []
		for (const selPos of sel.positions) {
			const retVal = fastCalcRetVal(selPos.forTuber.count, selPos.subsAtStart, selPos.amount, selPos.long)
			const posInClient: Utils.PositionInClient = {
				id: selPos.id,
				amount: selPos.amount,
				long: selPos.long,
				subsAtStart: selPos.subsAtStart,
				tuberName: selPos.tuberName,
				returnValue: retVal,
			}
			posesInClient.push(posInClient)
		}

		const ou: Utils.OtherUserOnClient = {
			id: sel.id,
			displayName: sel.displayName,
			idleStock: sel.idleStock,
			positions: posesInClient
		}
		otherUsers.push(ou)
	}

	return otherUsers
}

// export async function dbGetFreeInfo(){
// 	const msgsQuery = db
// 		.select({
// 			thing:Schema.chatMessages,
// 			// tubers:Schema.tubers,
// 		})
// 		.from(Schema.chatMessages)
// 		// .unionAll(Schema.tubers)
// 		// .fullJoin(Schema.tubers)

// 	// const tubersQuery = db.select({thing:Schema.tubers}).from(Schema.tubers)
// 	// const msgTuberUnion = await unionAll(msgsQuery,tubersQuery)

// 	const q = db.select(
// 		{
// 			msgs:Schema.chatMessages,
// 			tubers:Schema.tubers,
// 		}
// 	).from(Schema.chatMessages)
// 	// .unionAll()
// 	// .fullJoin(Schema.tubers,DORM.exists())
// }

export function broadcast(event: string, data: object) {
	for (const user of state.usersInMemory) {
		sendToUser(user, event, data)
	}
	removeClosedConnections()
}


export function sendToUser(user: UserInMemory, key: string, payload: object) {
	const con = user.con
	if (!con) return
	const res = Utils.runCatching(() => {
		con.enqueue(encode(key, payload));
	})
	if (res.failed) {
		console.log(' failed to enqeue');
		Utils.runCatching(() => con.close())
		user.con = undefined;
	}
}

function removeClosedConnections() {
	state.usersInMemory = state.usersInMemory.filter(u => u.con)
}

export async function broadcastTubersUpdated() {
	const allTubers = await dbGetAllTubers()
	const allPosesWithRetVals = await getPositionsWithRetVals()
	for (const memUser of state.usersInMemory) {
		if (!memUser.con) continue
		const posesForThisUser = allPosesWithRetVals.filter(p=>p.id == memUser.dbId)
		const worldEvent: Utils.WorldEvent = {
			tubers: allTubers,
			positions: posesForThisUser,
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
export async function calcReturnValue(pos: Schema.DbPosition): Promise<number | undefined> {
	// const foundTuber = state.tubers.findLast(t => t.channelId == pos.tuberId)
	const foundTuber = await dbGetTuberByPrimaryKey(pos.tuberfk)
	if (!foundTuber) return undefined

	return fastCalcRetVal(
		foundTuber.count,
		pos.subsAtStart,
		pos.amount,
		pos.long,
	)
}
export function fastCalcRetVal(currentCount: number, subsAtPosStart: number, posAmt: number, long: boolean): number {
	const subsGained = currentCount - subsAtPosStart
	const percentGain = subsGained / subsAtPosStart
	let bonus = Math.floor(posAmt * percentGain)
	if (!long) {
		bonus = bonus * -1
	}
	let ret = posAmt + bonus
	if (ret < 0) {
		ret = 0
	}
	return ret
}
export async function positionToPosWithReturnVal(pos: Schema.DbPosition): Promise<(Schema.DbPosition & { returnValue: number }) | undefined> {
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
	dbUpdateTuberCountByPKey(tuber.id, fetchedCount, today)
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
type KitEvent = Kit.RequestEvent<Partial<Record<string, string>>, string | null>
export async function getUserFromEvent(event: KitEvent): Promise<Schema.AppUser> {
	const uidCookie = event.cookies.get('uid')
	if (!uidCookie) {
		throw Kit.error(401, 'need a secret cookie');
	}
	const usernameCookie = event.cookies.get('username')
	if (!usernameCookie) {
		throw Kit.error(401, 'need a username cookie');
	}

	const foundUser = await dbGetUserBySecret(uidCookie)
	if (!foundUser) {
		throw Kit.error(401, 'user not found');
	}
	if (foundUser.displayName != usernameCookie) {
		throw Kit.error(401, 'username not match');
	}
	return foundUser
}

export function removeCookiesFromEvent(event: KitEvent) {
	event.cookies.delete('uid', { path: '/' })
	event.cookies.delete('username', { path: '/' })
}

export async function dbDeletePositionById(id: number) {
	await db.delete(Schema.positions).where(eq(Schema.positions.id, id))
	// state.positions = state.positions.filter(p => p.id !== id)
}

export async function dbGetPositionsForUser(usrPrimKey: number): Promise<Schema.DbPosition[]> {
	let selected = await db.select().from(Schema.positions).where(eq(Schema.positions.userfk, usrPrimKey))
	return selected
	// return state.positions.filter(p=>p.userfk == usrPrimKey)

}

export async function getPositionsWithRetVals():Promise<Utils.PositionInClient[]>{
	let selected = await db.query.positions.findMany({
		
		with:{
			forTuber:true
		}
	})
	const posesInClient : Utils.PositionInClient[] = []
	for(const sel of selected){
		const retVal = fastCalcRetVal(
			sel.forTuber.count,
			sel.subsAtStart,
			sel.amount,
			sel.long
		)

		const p : Utils.PositionInClient = {
			id:sel.id,
			amount:sel.amount,
			long:sel.long,
			tuberName:sel.forTuber.channelName,
			subsAtStart:sel.subsAtStart,
			returnValue:retVal,
		}
		posesInClient.push(p)
	}
	return posesInClient
}

export async function dbGetAllTubers(): Promise<Schema.DbTuber[]> {
	return db.query.tubers.findMany()
}

export async function dbGetUserBySecret(pId: string): Promise<Schema.AppUser | undefined> {
	// let usr = state.usersInDb.findLast(u => u.secret == pId);
	// let usr = await db.query.appusers.findFirst({where:{secret:pId}});
	const usrs = await db.select().from(Schema.appusers).where(eq(Schema.appusers.secret, pId));
	const usr = usrs.at(0)
	return usr
}

export async function dbGetAllUsers(): Promise<Schema.AppUser[]> {
	// let selected = await db.select().from(Schema.appusers)
	let found = await db.query.appusers.findMany()
	return found
	// return state.usersInDb
}

export async function dbGetTuberByPrimaryKey(tuberPKey: number): Promise<Schema.DbTuber | undefined> {
	let selected = await db.select().from(Schema.tubers).where(eq(Schema.tubers.id, tuberPKey))
	let t = selected.at(0)
	return t
	// return state.tubers.findLast(t => t.channelId == pos.tuberId)
	// return state.tubers.findLast(t => t.id == tuberPKey)
}
export async function dbGetTuberByChannelId(chanId: string): Promise<Schema.DbTuber | undefined> {
	let selected = await db.select().from(Schema.tubers).where(eq(Schema.tubers.channelId, chanId))
	let t = selected.at(0)
	return t
	// return state.tubers.findLast(t=>t.channelId == chanId)
}
export async function dbGetTuberByChannelName(chanName: string): Promise<Schema.DbTuber | undefined> {
	let selected = await db.select().from(Schema.tubers).where(eq(Schema.tubers.channelName, chanName))
	let t = selected.at(0)
	return t
	// return state.tubers.findLast(t=>t.channelName == chanName)
}
export async function dbInsertTuber(tuber: Schema.InsertDbTuber) {
	await db.insert(Schema.tubers).values(tuber)
}

export async function dbUpdateTuberCountByPKey(pKey: number, count: number, at: number) {
	await db.update(Schema.tubers).set({ count: count, countUpdatedAt: at }).where(eq(Schema.tubers.id, pKey))
}

export async function dbGetUserByPrimaryKey(pKey: number): Promise<Schema.AppUser | undefined> {
	const dbUsers = await db.select().from(Schema.appusers).where(eq(Schema.appusers.id, pKey))
	const dbUser = dbUsers.at(0)
	// const dbUser = state.usersInDb.findLast(u=>u.id == pKey)
	return dbUser
}

export async function dbDeleteUser(pKey: number) {
	await db.delete(Schema.appusers).where(eq(Schema.appusers.id, pKey))
}

export async function dbInsertUser(usrCreate: Schema.InsertAppUser): Promise<Schema.AppUser> {
	const ret = await db.insert(Schema.appusers).values(usrCreate).returning()
	const dbUsr = ret.at(0)
	if (!dbUsr) throw ' huh'
	return dbUsr
}

export async function dbInsertPosition(posCreate: Schema.InsertDbPosition): Promise<Schema.DbPosition> {
	// state.positions.push(dbPosition)
	const ret = await db.insert(Schema.positions).values(posCreate).returning()
	const dbPos = ret.at(0)
	if (!dbPos) throw ' huh'
	return dbPos
}

export async function dbgetMessagesWithUsers(startAtTime: number | 'latest') : Promise<Utils.ChatMsgOnClient[]> {
	let strtat : number | undefined
	if(startAtTime != 'latest'){
		strtat = startAtTime
	}else{
		strtat = new Date().getTime()
	}
	const numStrtAt : number = strtat
	const sel = await db.query.chatMessages.findMany({
		columns:{
			id:true,
			msgTxt:true,
			sentAt:true
		},
		with:{

			author:{

				columns:{
					displayName:true
				}
			}
		},
		where:(table, clause) => clause.lt(table.sentAt, numStrtAt),
		orderBy: [desc(Schema.chatMessages.sentAt)],
		limit:5,
	})

	return sel

}

export async function dbGetAllMsgs(): Promise<Schema.DbChatMsg[]> {
	// return state.msgs
	let selected = await db.select().from(Schema.chatMessages)
	return selected
}
export async function dbInsertMsg(msg: Schema.InsertDbChatMsg): Promise<Schema.DbChatMsg> {
	const inserted = await db.insert(Schema.chatMessages).values(msg).returning()
	const fInserted = inserted.at(0)
	if (!fInserted) throw Kit.error(500, 'failed to insert chat message')
	return fInserted
}

export async function dbGetInvites(forUserId:number){
	const res = await db.query.roomInvites.findMany({
        where:eq(Schema.roomInvites.userfk,forUserId),
        columns:{
            id:true,
            joined:true,
			userfk:true,
        },
        with:{
            toRoom:{
                columns:{
					id:true,
                    roomName:true,
					ownerId:true,
                },
				with:{
					msgs:{
						columns:{
							id:true,
							msgTxt:true,
							sentAt:true,

						},
						with:{
							author:{
								columns:{
									displayName:true
								}
							}
						},
						orderBy: [desc(Schema.privateMessages.sentAt)],
					},
				}
            }
        }
    })
	return res
}