import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Schema from '$lib/server/schema'
import * as Utils from '$lib/utils'
import { eq } from 'drizzle-orm';

export const POST: Kit.RequestHandler = async (event) => {
    await ServerState.fakeLatency()

    const foundUser = await ServerState.getUserFromEvent(event)
    let ej = await event.request.json()
    const parsed = Utils.userSearchRequestSchema.parse(ej)

    const foundSearchedById = await ServerState.db.query.appusers.findFirst({
        where: eq(Schema.appusers.id, parsed.userDbId),
        with: {
            positions: {
                columns: {
                    tuberfk: false,
                    userfk: false
                },
                with: {
                    forTuber: {
                        columns: {
                            count: true,
                            channelName: true,
                        }
                    }
                }
            },
        }
    })
    if (!foundSearchedById) {
        throw Kit.error(400, 'not found')
    }



    // broadcast new user list
    // const cUsrs = await ServerState.betterUsersOnServerToClient()
    // const w : Utils.WorldEvent = {
    // friends:
    // users:cUsrs
    // }
    // ServerState.broadcast('world',w)
    const posesInClient: Utils.PositionInClient[] = []
    for (const selPos of foundSearchedById.positions) {
        const retVal = ServerState.positionReturnValue(selPos.forTuber.count, selPos.subsAtStart, selPos.amount, selPos.long)
        const posInClient: Utils.PositionInClient = {
            id: selPos.id,
            amount: selPos.amount,
            long: selPos.long,
            subsAtStart: selPos.subsAtStart,
            tuberName: selPos.forTuber.channelName,
            returnValue: retVal,
        }
        posesInClient.push(posInClient)
    }

    const userOnClient: Utils.OtherUserOnClient = {
        id: foundSearchedById.id,
        displayName: foundSearchedById.displayName,
        idleStock: foundSearchedById.idleStock,
        positions: posesInClient
    }
    const resp: Utils.UserSearchResponse = {
        userDeets: userOnClient
    }
    return Kit.json(resp);
};