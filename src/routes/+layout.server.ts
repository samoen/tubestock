import * as Kit from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import * as ServerState from '$lib/server/serverState';
import * as Utils from '$lib/utils';
import * as Schema from '$lib/server/schema'

export const ssr = false;

export const load : LayoutServerLoad = async(event)=>{
    
    await ServerState.fakeLatency()
    const allTubers = await ServerState.dbGetAllTubers()
    const allMsgs = await ServerState.messagesToClient()
    const allUsrs = await ServerState.usersOnServerToClient()
    const dfl: Utils.DataFirstLoad = {
		users: allUsrs,
		tubers: allTubers,
		msgs: allMsgs,
	}

    let foundUser : Schema.AppUser | undefined = undefined
    try{
        foundUser = await ServerState.getUserFromEvent(event)
    }catch(e){
        console.log('serving layout without user')
    }
    if (!foundUser) {
        return dfl
    }

    const poses = await ServerState.dbGetPositionsForUser(foundUser.id)
    const cPoses = await ServerState.positionArrayToPosWithReturnValArray(poses)
    dfl.positions = cPoses
    dfl.yourName = foundUser.displayName
    dfl.yourIdleStock = foundUser.idleStock
    dfl.yourPrivateId = foundUser.secret
    return dfl
}