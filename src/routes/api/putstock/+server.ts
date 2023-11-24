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
    const uidCookie = event.cookies.get('uid')
    if(!uidCookie){
        return json({ error: 'no uid cookie' }, { status: 401 });
    }
    const usernameCookie = event.cookies.get('username')
    if(!usernameCookie){
        return json({ error: 'no username cookie' }, { status: 401 });
    }
    // const foundUser = ServerState.state.usersInDb.findLast(u=>u.privateId == uidCookie)
    const foundUser = await ServerState.dbGetUserByPrivateId(uidCookie)
    if(!foundUser){
        return json({ error: 'user not found' }, { status: 401 });
    }
    if(usernameCookie !== foundUser.displayName){
        return json({ error: 'uid not match username' }, { status: 401 });
    }
    const requestJson = await event.request.json()
    const putStockRequest = Utils.putStockRequestSchema.safeParse(requestJson)
    if(!putStockRequest.success){
        return json({ error: 'malformed put stock request' }, { status: 400 });
    }
    if(foundUser.idleStock < putStockRequest.data.amount){
        return json({ error: 'not enough idle stock' }, { status: 400 });
    }
    // const foundTuber = ServerState.state.tubers.findLast(t=>t.channelId == putStockRequest.data.channelId)
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

    // ServerState.state.positions.push(position)
    await ServerState.dbInsertPosition(position)
    const newIdle = foundUser.idleStock - putStockRequest.data.amount
    await ServerState.db.update(Schema.appusers).set({idleStock: newIdle}).where(eq(Schema.appusers.id,foundUser.id))
    // foundUser.idleStock -= putStockRequest.data.amount
    const poses = await ServerState.dbGetPositionsForUser(foundUser.id)
    const cPoses = await ServerState.positionArrayToPosWithReturnValArray(poses)
    const response : Utils.PutStockResponse = {
        idleStock:newIdle,
        positions: cPoses,
    }

    return json(response);
};