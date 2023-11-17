import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMsgSchema } from '$lib/utils';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'

export const POST: RequestHandler = async (r) => {
    const uid = r.cookies.get('uid')
    if(!uid){
        return json({ error: 'no uid cookie' }, { status: 401 });
    }
    const foundUser = ServerState.state.users.findLast(u=>u.uid == uid)
    if(!foundUser){
        return json({ error: 'user not found' }, { status: 401 });
    }

    const msg = await r.request.json();
    const sentMsg = sendMsgSchema.safeParse(msg)
    if (!sentMsg.success) {
        console.log('malformed sentmsg')
        return json({ error: 'malformed request' }, { status: 400 });
    }
    console.log(`server received chat ${JSON.stringify(msg)}`);
    const toSave : Utils.SavedChatMsg = {
        fromUserName: foundUser.displayName,
        msgTxt: sentMsg.data.msgTxt,
    }
    const toBroadCast : Utils.ChatMsgBroadcast = {
        newMsg:toSave
    }
    ServerState.state.msgs.push(toSave)
    ServerState.broadcastUserSentMessage(toBroadCast)

    return json({ good: true });
};