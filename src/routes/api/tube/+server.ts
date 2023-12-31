import * as Kit from '@sveltejs/kit';
import * as Utils from '$lib/utils'
import * as ServerState from '$lib/server/serverState'
import * as z from 'zod'
import * as Schema from '$lib/server/schema'

const searchResult = z.object({
    t: z.number(),
    list: z.array(
        z.array(z.string())
    )
})

export const POST: Kit.RequestHandler = async (requestEvent) => {
    await ServerState.fakeLatency()

    let reqJson = await requestEvent.request.json()
    const parsed = Utils.tubeRequestSchema.safeParse(reqJson)
    if (!parsed.success) {
        throw Kit.error(400,'Malformed request')
    }

    const t = await getTuuber(parsed.data.channelName)
    if(!t){
        throw Kit.error(400,'failed to get tuber')
    }

    const response: Utils.TubeResponse = {
        count: t.count
    }

    return Kit.json(response);
};

async function getTuuber(chanName:string) : Promise< Utils.TuberInClient | undefined>{
    // const foundTuber = ServerState.state.tubers.findLast(t=>t.channelName == chanName)
    const foundTuber = await ServerState.dbGetTuberByChannelName(chanName)
    if(foundTuber){
        console.log('got tuber from cache')
        return foundTuber
    }

    const fetched = await fetch(`https://mixerno.space/api/youtube-channel-counter/search/${chanName}`)
    let fText = await fetched.json()
    const parsedSearch = searchResult.safeParse(fText)
    if (!parsedSearch.success) {
        console.log('failed parse search')
        return undefined
    }
    const first = parsedSearch.data.list.at(0)
    if (!first) {
        return undefined
    }
    const tuberNameFromSearch = first.at(0)
    console.log('tubername from search ' + tuberNameFromSearch)
    const tubeId = first.at(2)
    if (!tubeId || !tuberNameFromSearch) {
        return undefined
    }
    
    const tuberSubs = await ServerState.fetchTuberSubsFromId(tubeId)
    if(tuberSubs == undefined){
        return undefined
    }
    const tuberCreate : Schema.InsertDbTuber = {
        channelName:tuberNameFromSearch,
        channelId:tubeId,
        count:tuberSubs,
        countUpdatedAt: new Date().getTime()
    }
    const inserteds = await ServerState.db.insert(Schema.tubers).values(tuberCreate).returning()
    const inserted = inserteds.at(0)
    if (!inserted){
        return undefined
    }
    
    
    const w : Utils.WorldEvent = {
        tubers:await ServerState.dbGetAllTubers()
    }
    ServerState.broadcast('world',w)
    const result : Utils.TuberInClient = {
        id: inserted.id,
        ...tuberCreate
    }
    return result
}