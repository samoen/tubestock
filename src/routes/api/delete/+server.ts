import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'

export const POST: Kit.RequestHandler = async (event) => {
    const uid = event.cookies.get('uid')
    if (!uid) {
        throw Kit.error(401, 'no uid cookie');
    }
    const usernameCookie = event.cookies.get('username')
    if (!usernameCookie) {
        throw Kit.error(401, 'no username cookie');
    }
    // const foundUser = ServerState.state.usersInDb.findLast(u => u.privateId == uid)
    const foundUser = await ServerState.dbGetUserByPrivateId(uid)
    if (!foundUser) {
        event.cookies.delete('uid', { path: '/' })
        event.cookies.delete('username', { path: '/' })
        throw Kit.error(401, 'user not found');
    }
    if (foundUser.displayName != usernameCookie) {
        event.cookies.delete('uid', { path: '/' })
        event.cookies.delete('username', { path: '/' })
        throw Kit.error(401, 'user not match');
    }
    Utils.findRunRemove(
        ServerState.state.usersInMemory,
        (u) => u.dbId == foundUser.id,
        (u) => {
            try{
                u.con?.close()
            }catch(e){}
        },
    )
    await ServerState.dbDeleteUser(foundUser.id)
    
    const cUsrs = await ServerState.usersOnServerToClient()
    const w : Utils.WorldEvent = {
        users:cUsrs
    }
    ServerState.broadcast('world',w)

    return Kit.json({});
};