import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import * as uuid from 'uuid'

export const POST: RequestHandler = async (event) => {
    const msg = await event.request.json();
    console.log(`signup request ${JSON.stringify(msg)}`);
    const parsed = Utils.setNameSchema.safeParse(msg)
    if (!parsed.success) {
        console.log('malformed signup')
        return json({ error: 'malformed sign up request' }, { status: 400 });
    }
    
    const existingUid = event.cookies.get('uid')
    if (existingUid) {
        console.log('already have uid')
        const foundUser = ServerState.state.users.findLast(u=>u.uid == existingUid)
        if(foundUser){
            console.log('user already signed up')
            return json({ error: 'already have uid' }, { status: 400 });
        }
    }

    const userId = uuid.v4();
    event.cookies.set('uid', userId, { path: '/', secure: false });
    event.cookies.set('username', parsed.data.wantName, { path: '/', secure: false });
    const userJoined : ServerState.UserOnServer = { 
        stream: undefined, 
        con: undefined, 
        displayName: parsed.data.wantName, 
        uid: userId,
        idleStock:100,
        positions:[],
    }

    ServerState.state.users.push(userJoined)
    ServerState.broadcastUserJoined(userJoined)

    const response : Utils.Welcome = {
        yourName: userJoined.displayName
    }

    return json(response);
};
