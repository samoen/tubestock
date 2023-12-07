import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMsgRequestSchema } from '$lib/utils';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import * as Uuid from 'uuid'
import * as Kit from '@sveltejs/kit'
import * as Schema from '$lib/server/schema'
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async (event) => {
    
    await ServerState.fakeLatency()

    const foundUser = await ServerState.getUserFromEvent(event)
    
    const requestJson = await event.request.json()
    const putStockRequest = Utils.putStockRequestSchema.safeParse(requestJson)
    if(!putStockRequest.success){
        throw Kit.error(400,'malformed request')
    }
    if(foundUser.idleStock < putStockRequest.data.amount){
        throw Kit.error(400,'not enough idle stock')
    }
    const foundTuber = await ServerState.dbGetTuberByChannelId(putStockRequest.data.channelId)
    
    if(!foundTuber){
        throw Kit.error(404,'tuber not found')
    }
    const position : Schema.InsertDbPosition = {
        userfk: foundUser.id,
        tuberfk: foundTuber.id,
        amount:putStockRequest.data.amount,
        subsAtStart:foundTuber.count,
        long:putStockRequest.data.long,
    }

    await ServerState.dbInsertPosition(position)
    
    const newIdle = foundUser.idleStock - putStockRequest.data.amount
    await ServerState.db.update(Schema.appusers).set({idleStock: newIdle}).where(eq(Schema.appusers.id,foundUser.id))
    
    const cPoses = await ServerState.positionsInClientForUser(foundUser.id)
    // const response : Utils.PutStockResponse = {
    //     idleStock:newIdle,
    //     positions: cPoses,
    // }
    
    // ServerState. broadcast('world',)
    const foundTargetUsrInMem = ServerState.state.usersInMemory.findLast(u => u.dbId == foundUser.id)
    if(!foundTargetUsrInMem){
        return Kit.json({})
    }
    let weTo : Utils.WorldEvent = {
        yourIdleStock:newIdle,
        positions:cPoses
    }
    ServerState.sendToUser(foundTargetUsrInMem,'world',weTo)


    
    return Kit.json({})
    // return json(response);
};