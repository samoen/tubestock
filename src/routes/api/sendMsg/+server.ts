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
    const sendMsgRequest = sendMsgRequestSchema.safeParse(msg)
    if (!sendMsgRequest.success) {
        return Kit.json({ error: 'malformed request' }, { status: 400 });
    }
    if(!sendMsgRequest.data.toRoomId){
        const sentAt : number = new Date().getTime()
        const toSave : Schema.InsertDbChatMsg = {
            msgTxt: sendMsgRequest.data.msgTxt,
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
        const toBroadCast : Utils.AddMsgEvent = {
            msg:msgToBroad
        }
        ServerState.broadcast('chatmsg',toBroadCast)
        return Kit.json({});
    }else{
        const sentAt : number = new Date().getTime()
        const toSave : Schema.InsertPrivateMsg = {
            roomfk:sendMsgRequest.data.toRoomId,
            msgTxt: sendMsgRequest.data.msgTxt,
            userfk: foundUser.id,
            sentAt: sentAt,
        }
        const inserteds = await ServerState.db
            .insert(Schema.privateMessages)
            .values(toSave)
            .returning()
        
        const inserted = inserteds.at(0)
        if(!inserted) return Kit.json({});

        // const usersInRoom = await ServerState.db.query.appusers.findMany({
        //     where:,
        //     with:{
        //         invites:{
        //             where:eq(Schema.roomInvites.id,sendMsgRequest.data.toRoomId)
        //         }
        //     }
        // })
        const invitesForRoom = await ServerState.db.query.roomInvites.findMany({
            where:and(
                eq(Schema.roomInvites.roomfk,sendMsgRequest.data.toRoomId),
                eq(Schema.roomInvites.joined,true),
            ),
            with:{
                forUser:true
            },
        })

        for (const i of invitesForRoom){
            const foundMem = ServerState.state.usersInMemory.findLast(u=>u.dbId == i.forUser.id)
            if(!foundMem)continue
            const toSend : Utils.AddMsgEvent = {
                msg:{
                    id:inserted.id,
                    author:{
                        displayName: foundUser.displayName
                    },
                    msgTxt:inserted.msgTxt,
                    sentAt:inserted.sentAt
                }
            }
            // ServerState.sendToUser(foundMem,'world',)
        }
    
        return Kit.json({});
    }
    
    return Kit.json({});
};