import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import * as Schema from '$lib/server/schema';
import { eq } from 'drizzle-orm';

export const POST: Kit.RequestHandler = async (event) => {
    await ServerState.fakeLatency()

    const foundUser = await ServerState.getUserFromEvent(event)

    const msg = await event.request.json();
    const parsed = Utils.setNameRequestSchema.safeParse(msg)
    if (!parsed.success) {
        throw Kit.error(400, 'malformed setname request')
    }

    await ServerState.db
        .update(Schema.appusers)
        .set({ displayName: parsed.data.wantName })
        .where(eq(Schema.appusers.id, foundUser.id))

    event.cookies.set('username', parsed.data.wantName, { path: '/', secure: false });

    const cUsrs = await ServerState.betterUsersOnServerToClient()
    const worldEvent: Utils.WorldEvent = {
        users: cUsrs
    }
    ServerState.broadcast('world', worldEvent)

    const response: Utils.SetNameResponse = {
        yourName: parsed.data.wantName
    }

    return Kit.json(response);
};
