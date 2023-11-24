import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMsgRequestSchema } from '$lib/utils';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import * as Uuid from 'uuid'

export const POST: RequestHandler = async (r) => {
    await ServerState.fakeLatency()
    const uid = r.cookies.get('uid')
    if(!uid){
        return json({ error: 'no uid cookie' }, { status: 401 });
    }
    const foundUser = ServerState.dbGetUserByPrivateId(uid)
    if(!foundUser){
        return json({ error: 'user not found' }, { status: 401 });
    }

    const msg = await r.request.json();
    const sentMsg = sendMsgRequestSchema.safeParse(msg)
    if (!sentMsg.success) {
        console.log('malformed sentmsg')
        return json({ error: 'malformed request' }, { status: 400 });
    }
    console.log(`server received chat ${JSON.stringify(msg)}`);
    const toSave : Utils.SavedChatMsg = {
        msgId:Uuid.v4(),
        fromUserName: foundUser.displayName,
        msgTxt: sentMsg.data.msgTxt,
    }
    const toBroadCast : Utils.ChatMsgBroadcast = {
        newMsg:toSave
    }
    ServerState.dbInsertMsg(toSave)
    ServerState.broadcast('chatmsg',toBroadCast)

    return json({});
};