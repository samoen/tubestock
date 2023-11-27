import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Schema from '$lib/server/schema'
import * as Utils from '$lib/utils'

export const POST: Kit.RequestHandler = async (event) => {

    const foundUser = await ServerState.getUserFromEvent(event)
    
    let j = await event.request.json()
    let p = Utils.createRoomRequestSchema.parse(j)

    let insertRoom : Schema.InsertPrivateRoom = {
        roomName:p.roomName,
        ownerId:foundUser.id
    }
    let insertedRooms = await ServerState.db.insert(Schema.privateRooms).values(insertRoom).returning()
    let roomInserted = insertedRooms.at(0)
    if(!roomInserted)throw Kit.error(500, 'failed to insert room')

    let insertInvite : Schema.InsertRoomInvite = {
        joined:true,
        userfk:foundUser.id,
        roomfk:roomInserted.id,
    }

    let insertedInvite = await ServerState.db.insert(Schema.roomInvites).values(insertInvite)
    let nowInvites = await ServerState.dbGetInvites(foundUser.id)

    const response : Utils.WorldEvent = {
        roomInvites:nowInvites
    }

    return Kit.json(response);
};