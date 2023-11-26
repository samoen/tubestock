import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMsgRequestSchema } from '$lib/utils';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async (event) => {
    const rJson = await event.request.json()
    const rSecret = rJson['secret']
    const envSecret = env.SAM_SECRET
    if (!rSecret) {
        throw error(401, 'bad secret')
    }
    if (rSecret !== envSecret) {
        throw error(401, 'bad secret')
    }

    updateThem()
    ServerState.broadcastTubersUpdated()

    return json({ good: true });
};

async function updateThem() {
    // const gotUpdated: Utils.TuberInClient[] = []
    const existingTubers = await ServerState.dbGetAllTubers()
    for (const tuber of existingTubers) {
        await ServerState.checkUpdateCount(tuber)
        // if (!didUpdate) continue
        // gotUpdated.push(tuber)
    }
}