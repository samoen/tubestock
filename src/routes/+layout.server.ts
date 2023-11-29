import * as Kit from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import * as ServerState from '$lib/server/serverState';
import * as Utils from '$lib/utils';
import * as Schema from '$lib/server/schema'
import * as DORM from 'drizzle-orm';

export const ssr = false;

export const load : LayoutServerLoad = async(event)=>{
    
    await ServerState.fakeLatency()
    const allTubers = await ServerState.dbGetAllTubers()
    const recentMsgs = await ServerState.db.query.chatMessages.findMany({
		columns: {
			id: true,
			msgTxt: true,
			sentAt: true
		},
		with: {
			author: {
				columns: {
					displayName: true
				}
			}
		},
		orderBy: [DORM.desc(Schema.chatMessages.sentAt)],
		limit: 5,
	})
    const allUsrs = await ServerState.betterUsersOnServerToClient()
    const dfl: Utils.WorldEvent = {
		users: allUsrs,
		tubers: allTubers,
		msgs: recentMsgs,
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
    const cInvites = await ServerState.dbGetInvites(foundUser.id)
    // console.log('fetching invites ' + JSON.stringify(cInvites))
    dfl.positions = cPoses
    dfl.yourName = foundUser.displayName
    dfl.yourIdleStock = foundUser.idleStock
    dfl.yourPrivateId = foundUser.secret
    dfl.yourDbId = foundUser.id
    dfl.roomInvites = cInvites
    return dfl
}