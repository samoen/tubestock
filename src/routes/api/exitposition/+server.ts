import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import * as Kit from '@sveltejs/kit';
import * as Schema from '$lib/server/schema'
import * as DORM from 'drizzle-orm';

export const POST: Kit.RequestHandler = async (event) => {
    await ServerState.fakeLatency()

    const foundUser = await ServerState.getUserFromEvent(event)

    const msg = await event.request.json();
    const parsed = Utils.exitPositionRequestSchema.safeParse(msg)
    if (!parsed.success) {
        throw Kit.error(400, 'malformed request');
    }

    const toExit = await ServerState.db.query.positions.findFirst({
        where: DORM.eq(Schema.positions.id, parsed.data.positionId),
        with:{
            forTuber:true
        }
    })
    if (!toExit) {
        throw Kit.error(400, 'position not found');
    }

    const returnValue = await ServerState.positionReturnValue(
        toExit.forTuber.count,
        toExit.subsAtStart,
        toExit.amount,
        toExit.long
    )
    if (returnValue == undefined) {
        throw Kit.error(500, 'Failed to calculate stock return value');
    }
    const idleAfterExit = foundUser.idleStock + returnValue
    await ServerState.db
        .update(Schema.appusers)
        .set({ idleStock: idleAfterExit })
        .where(DORM.eq(Schema.appusers.id, foundUser.id))

    console.log('deleting position id ' + toExit.id)
    await ServerState.dbDeletePositionById(toExit.id)

    const cPosesAfter = await ServerState.positionsInClientForUser(foundUser.id)

    const response: Utils.ExitPositionResponse = {
        idleStock: idleAfterExit,
        positions: cPosesAfter,
    }

    return Kit.json(response);
};
