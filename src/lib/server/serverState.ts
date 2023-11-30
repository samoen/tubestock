import * as Utils from "$lib/utils";
import * as NodePostgres from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as DbClient from '$lib/server/dbClient'
import * as Schema from '$lib/server/schema';
import * as DORM from "drizzle-orm"
import * as Kit from '@sveltejs/kit'

console.log('running serverstate')

export const db = NodePostgres.drizzle(DbClient.client, { schema: Schema });
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
	usersInMemory: UserInMemory[]
}

export const state: ServerAppState = {
	usersInMemory: [],
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
							count: true,
							channelName:true,
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
			const retVal = positionReturnValue(selPos.forTuber.count, selPos.subsAtStart, selPos.amount, selPos.long)
			const posInClient: Utils.PositionInClient = {
				id: selPos.id,
				amount: selPos.amount,
				long: selPos.long,
				subsAtStart: selPos.subsAtStart,
				tuberName: selPos.forTuber.channelName,
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

export function removeClosedConnections() {
	state.usersInMemory = state.usersInMemory.filter(u => u.con)
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

export function positionReturnValue(currentCount: number, subsAtPosStart: number, posAmt: number, long: boolean): number {
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

export async function positionsInClientForUser(userId: number): Promise<Utils.PositionInClient[]> {
	let gotp = await db.query.positions.findMany({
        where:DORM.eq(Schema.positions.userfk,userId),
        with:{
            forTuber:true
        }
    })

    const cPoses : Utils.PositionInClient[] = []
    for(const g of gotp){
        const ret = positionReturnValue(
            g.forTuber.count,
            g.subsAtStart,
            g.amount,
            g.long
        )

        const cpos : Utils.PositionInClient = {
            id:g.id,
            amount:g.amount,
            long:g.long,
            tuberName:g.forTuber.channelName,
            subsAtStart:g.subsAtStart,
            returnValue:ret
        }
        cPoses.push(cpos)
    }
	return cPoses
}



export async function checkUpdateCount(tuber: Schema.DbTuber): Promise<boolean> {
	let testing = true
	if (testing && import.meta.env.MODE == 'development') {
		const newCount = tuber.count + 500000
		const newAt = new Date().getTime()
		await new Promise(r => setTimeout(r, 500))
		await db
			.update(Schema.tubers)
			.set({ count: newCount, countUpdatedAt: newAt })
			.where(DORM.eq(Schema.tubers.id, tuber.id))
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
	await db
		.update(Schema.tubers)
		.set({ count: fetchedCount, countUpdatedAt: today })
		.where(DORM.eq(Schema.tubers.id, tuber.id))
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
	await db.delete(Schema.positions).where(DORM.eq(Schema.positions.id, id))
}

export async function dbGetPositionsForUser(usrPrimKey: number): Promise<Schema.DbPosition[]> {
	let selected = await db.select().from(Schema.positions).where(DORM.eq(Schema.positions.userfk, usrPrimKey))
	return selected
}

export async function dbGetAllTubers(): Promise<Schema.DbTuber[]> {
	return db.query.tubers.findMany()
}

export async function dbGetUserBySecret(pId: string): Promise<Schema.AppUser | undefined> {
	const usrs = await db.select().from(Schema.appusers).where(DORM.eq(Schema.appusers.secret, pId));
	const usr = usrs.at(0)
	return usr
}

export async function dbGetAllUsers(): Promise<Schema.AppUser[]> {
	let found = await db.query.appusers.findMany()
	return found
}

export async function dbGetTuberByPrimaryKey(tuberPKey: number): Promise<Schema.DbTuber | undefined> {
	let selected = await db.select().from(Schema.tubers).where(DORM.eq(Schema.tubers.id, tuberPKey))
	let t = selected.at(0)
	return t
}
export async function dbGetTuberByChannelId(chanId: string): Promise<Schema.DbTuber | undefined> {
	let selected = await db.select().from(Schema.tubers).where(DORM.eq(Schema.tubers.channelId, chanId))
	let t = selected.at(0)
	return t
}
export async function dbGetTuberByChannelName(chanName: string): Promise<Schema.DbTuber | undefined> {
	let selected = await db.select().from(Schema.tubers).where(DORM.eq(Schema.tubers.channelName, chanName))
	let t = selected.at(0)
	return t
}
export async function dbInsertTuber(tuber: Schema.InsertDbTuber) {
	await db.insert(Schema.tubers).values(tuber)
}

export async function dbGetUserByPrimaryKey(pKey: number): Promise<Schema.AppUser | undefined> {
	const dbUsers = await db.select().from(Schema.appusers).where(DORM.eq(Schema.appusers.id, pKey))
	const dbUser = dbUsers.at(0)
	return dbUser
}

export async function dbDeleteUser(pKey: number) {
	await db.delete(Schema.appusers).where(DORM.eq(Schema.appusers.id, pKey))
}

export async function dbInsertUser(usrCreate: Schema.InsertAppUser): Promise<Schema.AppUser> {
	const ret = await db.insert(Schema.appusers).values(usrCreate).returning()
	const dbUsr = ret.at(0)
	if (!dbUsr) throw 'Failed to insert user'
	return dbUsr
}

export async function dbInsertPosition(posCreate: Schema.InsertDbPosition): Promise<Schema.DbPosition> {
	const ret = await db.insert(Schema.positions).values(posCreate).returning()
	const dbPos = ret.at(0)
	if (!dbPos) throw 'Failed to insert position'
	return dbPos
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

export async function dbGetInvites(forUserId: number): Promise<Utils.InviteOnClient[]> {
	const res: Utils.InviteOnClient[] = await db.query.roomInvites.findMany({
		where: DORM.eq(Schema.roomInvites.userfk, forUserId),
		columns: {
			id: true,
			joined: true,
			userfk: true,
		},
		with: {
			toRoom: {
				columns: {
					id: true,
					roomName: true,
					ownerId: true,
				},
				with: {
					msgs: {
						columns: {
							id: true,
							msgTxt: true,
							sentAt: true,

						},
						with: {
							author: {
								columns: {
									displayName: true
								}
							}
						},
						orderBy: [DORM.desc(Schema.privateMessages.sentAt)],
						limit:5,
					},
					invites: {
						columns: {
							joined: true
						},
						with: {
							forUser: {
								columns: {
									id: true,
									displayName: true,
								}
							}
						}
					}
				}
			}
		}
	})
	return res
}
