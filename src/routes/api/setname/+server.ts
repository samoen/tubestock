import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import * as Schema  from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const POST: Kit.RequestHandler = async (event) => {
    await ServerState.fakeLatency()
    
    const existingUid = event.cookies.get('uid')
    if(!existingUid){
        throw Kit.error(401, 'need a uid cookie to set your name');
    }

    const msg = await event.request.json();
    const parsed = Utils.setNameRequestSchema.safeParse(msg)
    if (!parsed.success) {
        throw Kit.error(400,'malformed setname request')
    }
    
    // const foundUser = ServerState.state.usersInDb.findLast(u=>u.privateId == existingUid)
    const foundUser = await ServerState.dbGetUserByPrivateId(existingUid)
    if(!foundUser){
        throw Kit.error(400, 'user not found');
    }
    await ServerState.db.update(Schema.appusers).set({displayName:parsed.data.wantName}).where(eq(Schema.appusers.id,foundUser.id))
    // foundUser.displayName = parsed.data.wantName
    event.cookies.set('username', parsed.data.wantName, { path: '/', secure: false });
    const cUsrs = await ServerState.usersOnServerToClient()
    const worldEvent : Utils.WorldEvent = {
        users:cUsrs
    }
    ServerState.broadcast('world',worldEvent)

    const response : Utils.SetNameResponse = {
        yourName: parsed.data.wantName
    }

    return Kit.json(response);
};
