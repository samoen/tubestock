import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Schema from '$lib/server/schema'
import * as Utils from '$lib/utils'
import { and, eq } from 'drizzle-orm';
import { parse } from 'svelte/compiler';

export const POST: Kit.RequestHandler = async (event) => {

    await ServerState.fakeLatency()

    const foundUser = await ServerState.getUserFromEvent(event)

    const j = await event.request.json()
    const parsed = Utils.inviteToRoomRequestSchema.parse(j)

    if (foundUser.id == parsed.userToInviteId) {
        throw Kit.error(400, 'cant invite or kick yourself')
    }

    const foundRoom = await ServerState.db.query.privateRooms.findFirst({
        where: and(eq(Schema.privateRooms.id, parsed.roomId), eq(Schema.privateRooms.ownerId, foundUser.id))
    })

    if (!foundRoom) {
        throw Kit.error(401, 'you cant invite to that room')
    }


    const existingInvite = await ServerState.db.query.roomInvites.findFirst({
        where: and(eq(Schema.roomInvites.roomfk, parsed.roomId), eq(Schema.roomInvites.userfk, parsed.userToInviteId))
    })

    if (parsed.kick) {
        if (!existingInvite) {
            throw Kit.error(401, 'cant kick user not invited')
        }

        await ServerState.db
            .delete(Schema.roomInvites)
            .where(
                and(
                    eq(Schema.roomInvites.roomfk, parsed.roomId),
                    eq(Schema.roomInvites.userfk, parsed.userToInviteId),
                )
            )
        // notify target user
        const foundTargetUsrInMem = ServerState.state.usersInMemory.findLast(u => u.dbId == parsed.userToInviteId)
        if (foundTargetUsrInMem) {
            const cInvites = await ServerState.dbGetInvites(foundTargetUsrInMem.dbId)
            const worldToSend: Utils.WorldEvent = {
                roomInvites: cInvites
            }
            ServerState.sendToUser(foundTargetUsrInMem, 'world', worldToSend)
        }

    } else {
        if (existingInvite != undefined) {
            throw Kit.error(401, 'user already invited')
        }
        let insertInvite: Schema.InsertRoomInvite = {
            userfk: parsed.userToInviteId,
            joined: false,
            roomfk: parsed.roomId
        }

        let insertedInvite = await ServerState.db
            .insert(Schema.roomInvites)
            .values(insertInvite)
            .returning()
    }

    // notify everyone in room
    const invitesForRoom = await ServerState.db
        .query.roomInvites.findMany({
            where:
                // and(
                eq(Schema.roomInvites.roomfk, parsed.roomId),
            // eq(Schema.roomInvites.joined,true),
            // ),
            with: {
                forUser: true
            }
        })
    for (const i of invitesForRoom) {
        const foundUsrInMem = ServerState.state.usersInMemory.findLast(u => u.dbId == i.forUser.id)
        if (!foundUsrInMem) {
            continue
        }
        const cInvites = await ServerState.dbGetInvites(foundUsrInMem.dbId)
        const worldToSend: Utils.WorldEvent = {
            roomInvites: cInvites
        }

        ServerState.sendToUser(foundUsrInMem, 'world', worldToSend)
    }


    return Kit.json({});
};