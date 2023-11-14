import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMsgSchema } from '$lib/utils';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'

export const POST: RequestHandler = async (r) => {
    const uid = r.cookies.get('uid')
    if(!uid){
        return json({ error: 'no uid cookie' }, { status: 401 });
    }
    const foundUser = ServerState.state.users.findLast(u=>u.uid == uid)
    if(!foundUser){
        return json({ error: 'user not found' }, { status: 401 });
    }
    foundUser.con?.close()
    ServerState.state.users = ServerState.state.users.filter(u=>u.uid != uid)

    return json({ good: true });
};