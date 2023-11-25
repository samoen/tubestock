import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Schema from '$lib/server/schema'
import * as Utils from '$lib/utils'

export const POST: Kit.RequestHandler = async (event) => {

    const foundUser = await ServerState.getUserFromEvent(event)
    
    // delete user from db
    await ServerState.dbDeleteUser(foundUser.id)

    // delete user from memory
    Utils.findRunRemove(
        ServerState.state.usersInMemory,
        (u) => u.dbId == foundUser.id,
        (u) => {
            try{
                u.con?.close()
            }catch(e){}
        },
    )
    
    // broadcast new user list
    const cUsrs = await ServerState.betterUsersOnServerToClient()
    const w : Utils.WorldEvent = {
        users:cUsrs
    }
    ServerState.broadcast('world',w)

    return Kit.json({});
};