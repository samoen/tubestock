import * as Kit from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import * as ServerState from '$lib/server/serverState';
import * as Utils from '$lib/utils';

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
    let usernameCookie = event.cookies.get('username');
	let uidCookie = event.cookies.get('uid');
    const removeCookies = ()=>{
		event.cookies.delete('uid', { path: '/' })
		event.cookies.delete('username', { path: '/' })
		uidCookie = undefined
		usernameCookie = undefined
	}

	if(!uidCookie || !usernameCookie){
		removeCookies()
        return dfl
	}

    const foundUser = await ServerState.dbGetUserByPrivateId(uidCookie)
    if (!foundUser) {
        removeCookies()
        return dfl
    }
    if (foundUser.displayName != usernameCookie) {
        console.log('user not match ')
        removeCookies()
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