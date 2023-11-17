import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import * as uuid from 'uuid'

export const POST: RequestHandler = async (event) => {
    await ServerState.fakeLatency()
    
    const msg = await event.request.json();
    const parsed = Utils.setNameSchema.safeParse(msg)
    if (!parsed.success) {
        return json({ error: 'malformed setname request' }, { status: 400 });
    }
    
    const existingUid = event.cookies.get('uid')
    if(!existingUid){
        return json({ error: 'need a uid cookie to set your name' }, { status: 400 });
    }
    const foundUser = ServerState.state.users.findLast(u=>u.uid == existingUid)
    if(!foundUser){
        return json({ error: 'user not found' }, { status: 400 });
    }
    foundUser.displayName = parsed.data.wantName
    event.cookies.set('username', parsed.data.wantName, { path: '/', secure: false });

    const response : Utils.SetNameResponse = {
        yourName: parsed.data.wantName
    }

    return json(response);
};
