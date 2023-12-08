import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMsgRequestSchema } from '$lib/utils';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async (event) => {
    const rJson = await event.request.json()
    const rSecret = rJson['secret']
    const envSecret = env.SAM_SECRET
    if (!rSecret) {
        throw error(401, 'bad secret')
    }
    if (rSecret !== envSecret) {
        throw error(401, 'bad secret')
    }

    updateThem()

    return json({});
};

async function updateThem() {
    const allTubers = await ServerState.dbGetAllTubers()
    for (const tuber of allTubers) {
        await ServerState.checkUpdateCount(tuber)
    }
    const selected = await ServerState.db.query.positions.findMany({
		with:{
			forTuber:true,
			holder:true,
		}
	})
	type Selected = typeof selected[number]
	type SelectedWithRet = {sel:Selected,ret:number}
	const selectedWithRets : SelectedWithRet[] = []
	for(const sel of selected){
		const retVal = ServerState.positionReturnValue(
			sel.forTuber.count,
			sel.subsAtStart,
			sel.amount,
			sel.long
		)
		const p : SelectedWithRet = {
			sel:sel,
			ret:retVal,
		}
		selectedWithRets.push(p)
	}
	// const allusrs = await ServerState.betterUsersOnServerToClient()
	for (const memUser of ServerState.state.usersInMemory) {
		if (!memUser.con) continue
		const posesForThisUser = selectedWithRets.filter(p=>p.sel.holder.id == memUser.dbId)
		const posesToClient = posesForThisUser.map(p=>{
			const cli : Utils.PositionInClient = {
				id:p.sel.id,
				amount:p.sel.amount,
				long:p.sel.long,
				subsAtStart:p.sel.subsAtStart,
				tuberName:p.sel.forTuber.channelName,
				returnValue:p.ret,
			}
			return cli
		})

		const worldEvent: Utils.WorldEvent = {
			tubers: allTubers,
			positions: posesToClient,
			// users: allusrs,
		}
		ServerState.sendToUser(memUser, 'world', worldEvent)
	}
	ServerState.removeClosedConnections()
}