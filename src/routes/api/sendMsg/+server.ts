import * as Kit from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMsgRequestSchema } from '$lib/utils';
import * as ServerState from '$lib/server/serverState'
import * as Schema from '$lib/server/schema'
import * as Utils from '$lib/utils'
import * as Uuid from 'uuid'

export const POST: RequestHandler = async (event) => {
    await ServerState.fakeLatency()

    const foundUser = await ServerState.getUserFromEvent(event)

    const msg = await event.request.json();
    const sentMsg = sendMsgRequestSchema.safeParse(msg)
    if (!sentMsg.success) {
        return Kit.json({ error: 'malformed request' }, { status: 400 });
    }
    const sentAt : number = new Date().getTime()
    const toSave : Schema.InsertDbChatMsg = {
        msgTxt: sentMsg.data.msgTxt,
        userfk: foundUser.id,
        sentAt: sentAt,
    }
    const inserted = await ServerState.dbInsertMsg(toSave)

    const msgToBroad : Utils.ChatMsgOnClient = {
        id:inserted.id,
        msgTxt:inserted.msgTxt,
        sentAt:inserted.sentAt,
        author:{
            displayName:foundUser.displayName,
        },
    }
    const toBroadCast : Utils.ChatMsgsResponse = {
        msgs:[msgToBroad]
    }
    ServerState.broadcast('chatmsg',toBroadCast)

    return Kit.json({});
};