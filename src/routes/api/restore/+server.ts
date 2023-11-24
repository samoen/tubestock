import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'

export const POST: Kit.RequestHandler = async (event) => {
    await ServerState.fakeLatency()
    
    const msg = await event.request.json();
    const parsed = Utils.restoreRequestSchema.safeParse(msg)
    if (!parsed.success) {
        throw Kit.error(400,'malformed request')
    }
    console.log('restoring id ' + parsed.data.privateId)
    const foundUser = await ServerState.dbGetUserByPrivateId(parsed.data.privateId)
    if(!foundUser){
        throw Kit.error(400, 'user not found');
    }
    if(foundUser.displayName != parsed.data.displayName){
        throw Kit.error(400, 'user not match');
    }
    event.cookies.set('uid', foundUser.secret, { path: '/', secure: false });
	event.cookies.set('username', foundUser.displayName, { path: '/', secure: false });

    return Kit.json({});
};