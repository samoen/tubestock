import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMsgRequestSchema } from '$lib/utils';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import * as Uuid from 'uuid'
import * as Schema from '$lib/server/schema'
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async (event) => {
    
    await ServerState.fakeLatency()

    const foundUser = await ServerState.getUserFromEvent(event)
    
    const requestJson = await event.request.json()
    const putStockRequest = Utils.putStockRequestSchema.safeParse(requestJson)
    if(!putStockRequest.success){
        return json({ error: 'malformed put stock request' }, { status: 400 });
    }
    if(foundUser.idleStock < putStockRequest.data.amount){
        return json({ error: 'not enough idle stock' }, { status: 400 });
    }
    const foundTuber = await ServerState.dbGetTuberByChannelId(putStockRequest.data.channelId)

    if(!foundTuber){
        return json({ error: 'tuber not found' }, { status: 400 });
    }
    const position : Schema.InsertDbPosition = {
        userfk: foundUser.id,
        tuberfk: foundTuber.id,
        amount:putStockRequest.data.amount,
        subsAtStart:foundTuber.count,
        tuberName:foundTuber.channelName,
        long:putStockRequest.data.long,
    }

    await ServerState.dbInsertPosition(position)
    
    const newIdle = foundUser.idleStock - putStockRequest.data.amount
    await ServerState.db.update(Schema.appusers).set({idleStock: newIdle}).where(eq(Schema.appusers.id,foundUser.id))
    
    const poses = await ServerState.dbGetPositionsForUser(foundUser.id)
    const cPoses = await ServerState.positionArrayToPosWithReturnValArray(poses)
    const response : Utils.PutStockResponse = {
        idleStock:newIdle,
        positions: cPoses,
    }

    return json(response);
};