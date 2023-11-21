import * as Kit from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import * as ServerState from '$lib/server/serverState';
import * as Utils from '$lib/utils';

export const ssr = false;

export const load : LayoutServerLoad = async(event)=>{
    
    await ServerState.fakeLatency()
    
    const dfl: Utils.DataFirstLoad = {
		users: ServerState.usersOnServerToClient(),
		tubers: ServerState.state.tubers,
		msgs: ServerState.state.msgs,
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

    const foundUser = ServerState.state.users.findLast(u => u.uid == uidCookie);
    if (!foundUser) {
        removeCookies()
        return dfl
    }
    if (foundUser.displayName != usernameCookie) {
        console.log('user not match ')
        removeCookies()
        return dfl
    }

    dfl.positions = ServerState.positionArrayToPosWithReturnValArray(foundUser.positions)
    dfl.yourName = foundUser.displayName
    dfl.yourIdleStock = foundUser.idleStock
    return dfl
}