import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMsgSchema } from '$lib/utils';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'

export const POST: RequestHandler = async (event) => {
    const uidCookie = event.cookies.get('uid')
    if(!uidCookie){
        return json({ error: 'no uid cookie' }, { status: 401 });
    }
    const usernameCookie = event.cookies.get('username')
    if(!usernameCookie){
        return json({ error: 'no username cookie' }, { status: 401 });
    }
    const foundUser = ServerState.state.users.findLast(u=>u.uid == uidCookie)
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
    const foundTuber = ServerState.state.tubers.findLast(t=>t.channelId == putStockRequest.data.channelId)
    if(!foundTuber){
        return json({ error: 'tuber not found' }, { status: 400 });
    }
    const position : Utils.Position = {
        amount:putStockRequest.data.amount,
        subsAtStart:foundTuber.count,
        tuberId:foundTuber.channelId,
        tuberName:foundTuber.channelName,
        long:putStockRequest.data.long,
    }
    foundUser.positions.push(position)
    foundUser.idleStock -= putStockRequest.data.amount
    const response : Utils.PutStockResponse = {
        idleStock:foundUser.idleStock,
        positions: ServerState.positionArrayToPosWithReturnValArray(foundUser.positions),
    }

    return json(response);
};