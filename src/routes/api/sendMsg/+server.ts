import * as Kit from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMsgRequestSchema } from '$lib/utils';
import * as ServerState from '$lib/server/serverState'
import * as Schema from '$lib/server/schema'
import * as Utils from '$lib/utils'
import * as Uuid from 'uuid'

export const POST: RequestHandler = async (r) => {
    await ServerState.fakeLatency()
    const uid = r.cookies.get('uid')
    if(!uid){
        return Kit.json({ error: 'no uid cookie' }, { status: 401 });
    }
    const foundUser = await ServerState.dbGetUserByPrivateId(uid)
    if(!foundUser){
        return Kit.json({ error: 'user not found' }, { status: 401 });
    }

    const msg = await r.request.json();
    const sentMsg = sendMsgRequestSchema.safeParse(msg)
    if (!sentMsg.success) {
        console.log('malformed sentmsg')
        return Kit.json({ error: 'malformed request' }, { status: 400 });
    }
    console.log(`server received chat ${JSON.stringify(msg)}`);
    const toSave : Schema.InsertDbChatMsg = {
        fromUsername: foundUser.displayName,
        msgTxt: sentMsg.data.msgTxt,
    }
    let inserted = await ServerState.dbInsertMsg(toSave)
    if(!inserted){
        throw Kit.error(500, 'failed to insert msg')
    }

    const msgToBroad : Utils.ChatMsgOnClient = {
        fromUserName:foundUser.displayName,
        msgTxt:sentMsg.data.msgTxt,
        msgId:inserted?.id
    }
    const toBroadCast : Utils.ChatMsgBroadcast = {
        newMsg:msgToBroad
    }
    ServerState.broadcast('chatmsg',toBroadCast)

    return Kit.json({});
};