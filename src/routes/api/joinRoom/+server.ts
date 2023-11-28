import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Schema from '$lib/server/schema'
import * as Utils from '$lib/utils'
import { and, eq } from 'drizzle-orm';

export const POST: Kit.RequestHandler = async (event) => {

    await ServerState.fakeLatency()

    const foundUser = await ServerState.getUserFromEvent(event)
    
    let j = await event.request.json()
    let p = Utils.joinRoomRequestSchema.parse(j)

    const foundInvite = await ServerState.db.query.roomInvites.findFirst({
        where: and(eq(Schema.roomInvites.roomfk,p.roomIdToJoin),eq(Schema.roomInvites.joined,false))
    })

    if(!foundInvite){
        throw Kit.error(401,'you cant join that room')
    }

    // let insertInvite : Schema.Upd = {
    //     userfk:p.userToInviteId,
    //     joined:false,
    //     roomfk:p.roomId
    // }

    let updatedInvite = await ServerState.db
        .update(Schema.roomInvites)
        .set({joined:true})
        .where(eq(Schema.roomInvites.id,foundInvite.id))

    // const foundUsrInMem = ServerState.state.usersInMemory.findLast(u=>u.dbId == p.userToInviteId)
    // if(!foundUsrInMem){
    //     return Kit.json({})
    // }
    const cInvites = await ServerState.dbGetInvites(foundUser.id)
    const worldToSend : Utils.WorldEvent = {
        roomInvites: cInvites
    }

    // ServerState.sendToUser(foundUsrInMem,'world',worldToSend)
    // let nowInvites = await ServerState.dbGetInvites(foundUser.id)

    // const response : Utils.WorldEvent = {
    //     roomInvites:nowInvites
    // }

    return Kit.json(worldToSend);
};