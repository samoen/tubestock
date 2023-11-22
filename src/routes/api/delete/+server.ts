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
    const foundUser = ServerState.state.usersInDb.findLast(u => u.privateId == uid)
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
        (u) => u.dbId == foundUser.dbId,
        (u) => {
            try{
                u.con?.close()
            }catch(e){}
        },
    )
    Utils.findRunRemove(
        ServerState.state.usersInDb,
        (u) => u.dbId == foundUser.dbId,
        (u) => {
            console.log(`user ${u.displayName} removed from db`)
        },
    )
    
    let w : Utils.WorldEvent = {
        users:ServerState.usersOnServerToClient()
    }
    ServerState.broadcast('world',w)

    return Kit.json({});
};