import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import * as Kit from '@sveltejs/kit';
import * as Schema from '$lib/server/schema'
import { eq } from 'drizzle-orm';

export const POST: Kit.RequestHandler = async (event) => {
    await ServerState.fakeLatency()

    const foundUser = await ServerState.getUserFromEvent(event)
    
    const msg = await event.request.json();
    const parsed = Utils.exitPositionRequestSchema.safeParse(msg)
    if (!parsed.success) {
        throw Kit.error(400, 'malformed request');
    }

    const poses = await ServerState.dbGetPositionsForUser(foundUser.id)
    const toExit = poses.findLast(p => p.id == parsed.data.positionId)
    if (!toExit) {
        throw Kit.error(400, 'position not found');
    }
    
    const returnValue = await ServerState.calcReturnValue(toExit)
    if (returnValue == undefined){
        throw Kit.error(500, 'Failed to calculate stock return value');
    }
    const idleAfterExit = foundUser.idleStock+returnValue
    await ServerState.db.update(Schema.appusers).set({idleStock:idleAfterExit}).where(eq(Schema.appusers.id,foundUser.id))
    // foundUser.idleStock += returnValue
    console.log('deleting position id ' + toExit.id)
    await ServerState.dbDeletePositionById(toExit.id)
    const posesAfter = await ServerState.dbGetPositionsForUser(foundUser.id)
    const cPosesAfter = await ServerState.positionArrayToPosWithReturnValArray(posesAfter)

    const response: Utils.ExitPositionResponse = {
        idleStock: idleAfterExit,
        positions: cPosesAfter,
    }

    return Kit.json(response);
};
