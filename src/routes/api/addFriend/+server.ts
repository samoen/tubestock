import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Schema from '$lib/server/schema'
import * as Utils from '$lib/utils'
import { and, eq } from 'drizzle-orm';

export const POST: Kit.RequestHandler = async (event) => {

    await ServerState.fakeLatency()

    const foundUser = await ServerState.getUserFromEvent(event)
    
    let j = await event.request.json()
    let p = Utils.addFriendRequestSchema.parse(j)

    
    
    const existingFriendship = await ServerState.db.query.friendships.findFirst({
        where: and(
            eq(Schema.friendships.userfk,foundUser.id),
            eq(Schema.friendships.toUserfk,p.userDbId),
            ),
        })
    if(p.remove){
        if(!existingFriendship){
            throw Kit.error(401,'Cant remove not friend')
        }
    }
    if(!p.remove){
        if(existingFriendship){
            throw Kit.error(401,'Already friends')
        }
    }
    
    const foundTarget = await ServerState.db.query.appusers.findFirst({where:eq(Schema.appusers.id,p.userDbId)})
    if(!foundTarget){
        throw Kit.error(401,'target user not found')
    }
    if(p.remove){
        await ServerState.db
            .delete(Schema.friendships)
            .where(and(
                eq(Schema.friendships.userfk,foundUser.id),
                eq(Schema.friendships.toUserfk,foundTarget.id)),
            ) 
    }
    if(!p.remove){
        
        let insertable : Schema.InsertFriendship = {
            userfk:foundUser.id,
            toUserfk:foundTarget.id
        }
        await ServerState.db.insert(Schema.friendships).values(insertable)
    }



    const friendsOnClient = await ServerState.dbGetFriends(foundUser.id)
    const worldToSend : Utils.WorldEvent = {
        friends:friendsOnClient
    }

    return Kit.json(worldToSend);
};