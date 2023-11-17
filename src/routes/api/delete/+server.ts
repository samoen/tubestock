import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'

export const POST: Kit.RequestHandler = async (event) => {
    const uid = event.cookies.get('uid')
    if (!uid) {
        throw Kit.error(401,'no uid cookie');
    }
    const usernameCookie = event.cookies.get('username')
    if (!usernameCookie) {
        throw Kit.error(401,'no username cookie');
    }
    const foundUser = ServerState.state.users.findLast(u => u.uid == uid)
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
    foundUser.con?.close()
    ServerState.state.users = ServerState.state.users.filter(u => u.uid != uid)

    return Kit.json({});
};