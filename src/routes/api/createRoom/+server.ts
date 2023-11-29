import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Schema from '$lib/server/schema'
import * as Utils from '$lib/utils'
import { and, eq } from 'drizzle-orm';

export const POST: Kit.RequestHandler = async (event) => {

    await ServerState.fakeLatency()

    const foundUser = await ServerState.getUserFromEvent(event)

    const j = await event.request.json()
    const createRequest = Utils.createRoomRequestSchema.safeParse(j)
    if (createRequest.success) {
        let insertRoom: Schema.InsertPrivateRoom = {
            roomName: createRequest.data.roomName,
            ownerId: foundUser.id
        }
        let insertedRooms = await ServerState.db.insert(Schema.privateRooms).values(insertRoom).returning()
        let roomInserted = insertedRooms.at(0)
        if (!roomInserted) throw Kit.error(500, 'failed to insert room')

        let insertInvite: Schema.InsertRoomInvite = {
            joined: true,
            userfk: foundUser.id,
            roomfk: roomInserted.id,
        }

        let insertedInvite = await ServerState.db.insert(Schema.roomInvites).values(insertInvite)
        let nowInvites = await ServerState.dbGetInvites(foundUser.id)

        const response: Utils.WorldEvent = {
            roomInvites: nowInvites
        }

        return Kit.json(response);
    }
    const deleteRequest = Utils.deleteRoomRequestSchema.parse(j)

    const invitesForRoom = await ServerState.db
        .query.roomInvites.findMany({
            where: eq(Schema.roomInvites.roomfk, deleteRequest.rId),
            with: {
                forUser: true
            }
        })
    await ServerState.db.delete(Schema.privateRooms).where(and(
        eq(
            Schema.privateRooms.id, deleteRequest.rId
        ),
        eq(
            Schema.privateRooms.ownerId, foundUser.id
        ),

    ))
    for (const i of invitesForRoom) {
        const foundUsrInMem = ServerState.state.usersInMemory.findLast(u => u.dbId == i.forUser.id)
        if (!foundUsrInMem) {
            continue
        }
        const cInvites = await ServerState.dbGetInvites(foundUsrInMem.dbId)
        const worldToSend: Utils.WorldEvent = {
            roomInvites: cInvites
        }

        ServerState.sendToUser(foundUsrInMem, 'world', worldToSend)
    }
    const resp: Utils.WorldEvent = {}
    return Kit.json(resp)

};