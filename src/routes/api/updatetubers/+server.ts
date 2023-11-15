import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMsgSchema } from '$lib/utils';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async (event) => {
    const rJson = await event.request.json()
    const rSecret = rJson['secret']
    const envSecret = env.SAM_SECRET
    if(!rSecret){
        throw error(401,'bad secret')
    }
    if(rSecret !== envSecret){
        throw error(401,'bad secret')
    }

    updateThem()
    

    return json({ good: true });
};

async function updateThem(){
    for(const tuber of ServerState.state.tubers){
        await ServerState.checkUpdateCount(tuber)
    }
}