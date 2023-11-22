import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'

export const POST: Kit.RequestHandler = async (event) => {
    await ServerState.fakeLatency()
    
    const msg = await event.request.json();
    const parsed = Utils.setNameRequestSchema.safeParse(msg)
    if (!parsed.success) {
        throw Kit.error(400,'malformed setname request')
    }
    
    const existingUid = event.cookies.get('uid')
    if(!existingUid){
        throw Kit.error(400, 'need a uid cookie to set your name');
    }
    const foundUser = ServerState.state.usersInDb.findLast(u=>u.privateId == existingUid)
    if(!foundUser){
        throw Kit.error(400, 'user not found');
    }
    foundUser.displayName = parsed.data.wantName
    event.cookies.set('username', parsed.data.wantName, { path: '/', secure: false });

    const worldEvent : Utils.WorldEvent = {
        users:ServerState.usersOnServerToClient()
    }
    ServerState.broadcast('world',worldEvent)

    const response : Utils.SetNameResponse = {
        yourName: parsed.data.wantName
    }

    return Kit.json(response);
};
