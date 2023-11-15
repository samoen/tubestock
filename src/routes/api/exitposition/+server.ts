import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import * as uuid from 'uuid'

export const POST: RequestHandler = async (event) => {
    const uidCookie = event.cookies.get('uid')
    if(!uidCookie){
        return json({ error: 'need a uid cookie to exit position' }, { status: 401 });
    }
    const usernameCookie = event.cookies.get('username')
    if(!usernameCookie){
        return json({ error: 'need a username cookie to exit position' }, { status: 401 });
    }
    
    const foundUser = ServerState.state.users.findLast(u=>u.uid == uidCookie && u.displayName == usernameCookie)
    if(!foundUser){
        return json({ error: 'user not found' }, { status: 401 });
    }

    const msg = await event.request.json();
    const parsed = Utils.exitPositionRequestSchema.safeParse(msg)
    if (!parsed.success) {
        return json({ error: 'malformed exitposition request' }, { status: 400 });
    }
    // const current = ServerState.state.tubers.findLast(t=>t.channelId == parsed.data.channelId)
    // if(!current){
    //     return json({ error: 'tuber not in list' }, { status: 400 });
    // }

    const toExits = foundUser.positions.filter(p=>p.tuberId == parsed.data.channelId)

    for(const toExit of toExits){
        const bonus = ServerState.calcReturnValue(toExit)
        if(bonus == undefined)continue
        const refund = toExit.amount + bonus
        foundUser.idleStock += refund

    }
    foundUser.positions = foundUser.positions.filter(p=>p.tuberId !== parsed.data.channelId)
    

    const response : Utils.ExitPositionResponse = {
        idleStock: foundUser.idleStock,
        positions: ServerState.positionArrayToPosWithReturnValArray(foundUser.positions),
    }

    return json(response);
};
