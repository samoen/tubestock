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
        where: and(
            eq(Schema.roomInvites.userfk,foundUser.id),
            eq(Schema.roomInvites.roomfk,p.roomIdToJoin),
        ),
        with:{
            toRoom:true
        }
    })
    

    if(!foundInvite){
        throw Kit.error(401,'Invite not found')
    }

    if(foundInvite.toRoom.ownerId == foundUser.id){
        throw Kit.error(400,'cant leave your own room')
    }

    let updatedInvite = await ServerState.db
        .update(Schema.roomInvites)
        .set({joined:!p.leave})
        .where(eq(Schema.roomInvites.id,foundInvite.id))

    const cInvites = await ServerState.dbGetInvites(foundUser.id)
    const worldToSend : Utils.WorldEvent = {
        roomInvites: cInvites
    }

    return Kit.json(worldToSend);
};