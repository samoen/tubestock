import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Schema from '$lib/server/schema'
import * as Utils from '$lib/utils'
import { and, eq } from 'drizzle-orm';

export const POST: Kit.RequestHandler = async (event) => {

    await ServerState.fakeLatency()

    const foundUser = await ServerState.getUserFromEvent(event)
    
    let j = await event.request.json()
    let p = Utils.inviteToRoomRequestSchema.parse(j)

    const foundRoom = await ServerState.db.query.privateRooms.findFirst({
        where: and(eq(Schema.privateRooms.id,p.roomId),eq(Schema.privateRooms.ownerId,foundUser.id))
    })

    if(!foundRoom){
        throw Kit.error(401,'you cant invite to that room')
    }

    let insertInvite : Schema.InsertRoomInvite = {
        userfk:p.userToInviteId,
        joined:false,
        roomfk:p.roomId
    }

    let insertedInvite = await ServerState.db
        .insert(Schema.roomInvites)
        .values(insertInvite)
        .returning()
    
    const foundUsrInMem = ServerState.state.usersInMemory.findLast(u=>u.dbId == p.userToInviteId)
    if(!foundUsrInMem){
        return Kit.json({})
    }
    const cInvites = await ServerState.dbGetInvites(foundUsrInMem.dbId)
    const worldToSend : Utils.WorldEvent = {
        roomInvites: cInvites
    }

    ServerState.sendToUser(foundUsrInMem,'world',worldToSend)
    // let nowInvites = await ServerState.dbGetInvites(foundUser.id)

    // const response : Utils.WorldEvent = {
    //     roomInvites:nowInvites
    // }

    return Kit.json({});
};