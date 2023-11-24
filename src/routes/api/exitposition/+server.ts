import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import * as Kit from '@sveltejs/kit';

export const POST: Kit.RequestHandler = async (event) => {
    await ServerState.fakeLatency()
    const uidCookie = event.cookies.get('uid')
    if (!uidCookie) {
        throw Kit.error(401, 'need a uid cookie to exit position');
    }
    const usernameCookie = event.cookies.get('username')
    if (!usernameCookie) {
        throw Kit.error(401, 'need a username cookie to exit position');
    }

    // const foundUser = ServerState.state.usersInDb.findLast(u => u.privateId == uidCookie && u.displayName == usernameCookie)
    const foundUser = ServerState.dbGetUserByPrivateId(uidCookie)
    if (!foundUser) {
        throw Kit.error(401, 'user not found');
    }
    if (foundUser.displayName != usernameCookie) {
        throw Kit.error(401, 'username not match');
    }

    const msg = await event.request.json();
    const parsed = Utils.exitPositionRequestSchema.safeParse(msg)
    if (!parsed.success) {
        throw Kit.error(400, 'malformed request');
    }
    const poses = ServerState.dbGetPositionsForUser(foundUser.pKey)
    const toExit = poses.findLast(p => p.positionId == parsed.data.positionId)
    if (!toExit) {
        throw Kit.error(400, 'position not found');
    }
    
    const returnValue = ServerState.calcReturnValue(toExit)
    if (returnValue == undefined){
        throw Kit.error(500, 'Failed to calculate stock return value');
    }
    foundUser.idleStock += returnValue
    ServerState.dbDeletePositionById(toExit.positionId)
    const posesAfter = ServerState.dbGetPositionsForUser(foundUser.pKey)


    const response: Utils.ExitPositionResponse = {
        idleStock: foundUser.idleStock,
        positions: ServerState.positionArrayToPosWithReturnValArray(posesAfter),
    }

    return Kit.json(response);
};
