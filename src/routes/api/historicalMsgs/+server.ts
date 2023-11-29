import * as Kit from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMsgRequestSchema } from '$lib/utils';
import * as ServerState from '$lib/server/serverState'
import * as Schema from '$lib/server/schema'
import * as Utils from '$lib/utils'
import * as DORM from 'drizzle-orm'

export const POST: RequestHandler = async (event) => {
    await ServerState.fakeLatency()
    const requestJson = await event.request.json()
    const parsed = Utils.historicalMsgsRequestSchema.parse(requestJson)

    if (!parsed.roomId) {
        const got = await ServerState.db.query.chatMessages.findMany({
            columns: {
                id: true,
                msgTxt: true,
                sentAt: true
            },
            with: {
                author: {
                    columns: {
                        displayName: true
                    }
                }
            },
            // where: (table, clause) => clause.lt(table.sentAt, parsed.startAtTime),
            where: DORM.lt(Schema.chatMessages.sentAt, parsed.startAtTime),
            orderBy: [DORM.desc(Schema.chatMessages.sentAt)],
            limit: 5,
        })

        const resp: Utils.ChatMsgsResponse = {
            msgs: got
        }
        return Kit.json(resp)
    }
    const got = await ServerState.db.query.privateMessages.findMany({
        columns: {
            id: true,
            msgTxt: true,
            sentAt: true
        },
        with: {
            author: {
                columns: {
                    displayName: true
                }
            }
        },
        where: DORM.and(
            DORM.eq(Schema.privateMessages.roomfk, parsed.roomId),
            DORM.lt(Schema.privateMessages.sentAt, parsed.startAtTime),
        ),
        orderBy: [DORM.desc(Schema.privateMessages.sentAt)],
        limit: 5,
    })

    const resp: Utils.ChatMsgsResponse = {
        msgs: got
    }
    return Kit.json(resp)
}