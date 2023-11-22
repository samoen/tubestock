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

    const foundUser = ServerState.state.usersInDb.findLast(u => u.privateId == uidCookie && u.displayName == usernameCookie)
    if (!foundUser) {
        throw Kit.error(401, 'user not found');
    }

    const msg = await event.request.json();
    const parsed = Utils.exitPositionRequestSchema.safeParse(msg)
    if (!parsed.success) {
        throw Kit.error(400, 'malformed request');
    }

    const toExit = foundUser.positions.findLast(p => p.positionId == parsed.data.positionId)
    if (!toExit) {
        throw Kit.error(400, 'position not found');
    }
    
    const returnValue = ServerState.calcReturnValue(toExit)
    if (returnValue == undefined){
        throw Kit.error(500, 'Failed to calculate stock return value');
    }
    foundUser.idleStock += returnValue
    foundUser.positions = foundUser.positions.filter(p => p.positionId !== parsed.data.positionId)


    const response: Utils.ExitPositionResponse = {
        idleStock: foundUser.idleStock,
        positions: ServerState.positionArrayToPosWithReturnValArray(foundUser.positions),
    }

    return Kit.json(response);
};
