import * as Kit from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMsgRequestSchema } from '$lib/utils';
import * as ServerState from '$lib/server/serverState'
import * as Schema from '$lib/server/schema'
import * as Utils from '$lib/utils'

export const POST: RequestHandler = async (event) => {
    await ServerState.fakeLatency()
    const requestJson = await event.request.json()
    const parsed = Utils.historicalMsgsRequestSchema.parse(requestJson)
    
    const got = await ServerState.messagesToClient(parsed.startAtTime)

    const resp : Utils.ChatMsgsResponse = {
        msgs:got
    }
    return Kit.json(resp)
}