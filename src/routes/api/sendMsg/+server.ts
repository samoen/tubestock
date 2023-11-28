import * as Kit from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMsgRequestSchema } from '$lib/utils';
import * as ServerState from '$lib/server/serverState'
import * as Schema from '$lib/server/schema'
import * as Utils from '$lib/utils'
import { and, eq } from 'drizzle-orm';

export const POST: RequestHandler = async (event) => {
    await ServerState.fakeLatency()

    const foundUser = await ServerState.getUserFromEvent(event)

    const msg = await event.request.json();
    const sendMsgRequest = sendMsgRequestSchema.parse(msg)

    if (!sendMsgRequest.toRoomId) {
        const sentAt: number = new Date().getTime()
        const toSave: Schema.InsertDbChatMsg = {
            msgTxt: sendMsgRequest.msgTxt,
            userfk: foundUser.id,
            sentAt: sentAt,
        }
        const inserted = await ServerState.dbInsertMsg(toSave)

        const msgToBroad: Utils.ChatMsgOnClient = {
            id: inserted.id,
            msgTxt: inserted.msgTxt,
            sentAt: inserted.sentAt,
            author: {
                displayName: foundUser.displayName,
            },
        }
        const toBroadCast: Utils.AddMsgEvent = {
            msg: msgToBroad
        }
        ServerState.broadcast('chatmsg', toBroadCast)
        return Kit.json({});
    }

    const theirInvite = await ServerState.db.query.roomInvites.findFirst({
        where:and(
            eq(Schema.roomInvites.roomfk, sendMsgRequest.toRoomId),
            eq(Schema.roomInvites.userfk, foundUser.id),
            eq(Schema.roomInvites.joined, true),
        ) 
    })
    if(!theirInvite){
        throw Kit.error(400,'your are not in that room')
    }

    const sentAt: number = new Date().getTime()
    const toSave: Schema.InsertPrivateMsg = {
        roomfk: sendMsgRequest.toRoomId,
        msgTxt: sendMsgRequest.msgTxt,
        userfk: foundUser.id,
        sentAt: sentAt,
    }
    const inserteds = await ServerState.db
        .insert(Schema.privateMessages)
        .values(toSave)
        .returning()

    const inserted = inserteds.at(0)
    if (!inserted) return Kit.json({});

    const invitesForRoom = await ServerState.db.query.roomInvites.findMany({
        where: and(
            eq(Schema.roomInvites.roomfk, sendMsgRequest.toRoomId),
            eq(Schema.roomInvites.joined, true),
        ),
        with: {
            forUser: true
        },
    })
    console.log('sending to users in room ' + JSON.stringify(invitesForRoom))
    for (const i of invitesForRoom) {
        const foundMem = ServerState.state.usersInMemory.findLast(u => u.dbId == i.forUser.id)
        if (!foundMem) continue
        const toSend: Utils.AddMsgEvent = {
            msg: {
                id: inserted.id,
                author: {
                    displayName: foundUser.displayName
                },
                msgTxt: inserted.msgTxt,
                sentAt: inserted.sentAt
            },
            roomId: inserted.roomfk
        }
        console.log('sending msg to usr')
        ServerState.sendToUser(foundMem, 'chatmsg', toSend)
    }

    return Kit.json({});

    return Kit.json({});
};