import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as ServerState from '$lib/server/serverState'
import { setNameSchema } from '$lib/utils';
// import * as uuid from 'uuid'
import { v4 } from 'uuid';

export const POST: RequestHandler = async (r) => {
    const msg = await r.request.json();
    console.log(`signup request ${JSON.stringify(msg)}`);
    const parsed = setNameSchema.safeParse(msg)
    if (!parsed.success) {
        console.log('malformed signup')
        return json({ error: 'malformed sign up request' }, { status: 400 });
    }
    
    const existingUid = r.cookies.get('uid')
    if (existingUid) {
        console.log('already have uid')
        const foundUser = ServerState.state.users.findLast(u=>u.uid == existingUid)
        if(foundUser){
            console.log('user already signed up')
            return json({ error: 'already have uid' }, { status: 400 });
        }
    }

    const userId = v4();
    r.cookies.set('uid', userId, { path: '/', secure: false });
    r.cookies.set('username', parsed.data.wantName, { path: '/', secure: false });
    const userJoined = { stream: undefined, con: undefined, displayName: parsed.data.wantName, uid: userId }

    ServerState.state.users.push(userJoined)
    ServerState.broadcastUserJoined(userJoined)


    return json({ yourName: userJoined.displayName });
};
