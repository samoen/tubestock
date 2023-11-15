import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as Utils from '$lib/utils'
import * as ServerState from '$lib/server/serverState'
import * as z from 'zod'

const searchResult = z.object({
    t: z.number(),
    list: z.array(
        z.array(z.string())
    )
})

export const POST: RequestHandler = async (requestEvent) => {
    let reqJson = await requestEvent.request.json()
    const parsed = Utils.tubeRequestSchema.safeParse(reqJson)
    if (!parsed.success) {
        return json({ good: false })
    }
    console.log('will process ' + parsed.data.channelName)

    const foundTuber = ServerState.state.tubers.findLast(t=>t.channelName == parsed.data.channelName)
    if(foundTuber){
        console.log('got tuber from cache')
        const response : Utils.TubeResponse = {
            count:foundTuber.count
        }
        return json(response)
    }

    const fetched = await fetch(`https://mixerno.space/api/youtube-channel-counter/search/${parsed.data.channelName}`)
    let fText = await fetched.json()
    // const parsedSearch = searchResult.safeParse(JSON.parse(fText))
    const parsedSearch = searchResult.safeParse(fText)
    if (!parsedSearch.success) {
        console.log('failed parse search')
        return json({ good: false })
    }
    const first = parsedSearch.data.list.at(0)
    if (!first) {
        console.log('failed search')
        return json({ good: false })
    }
    const tuberNameFromSearch = first.at(0)
    console.log('tubername from search ' + tuberNameFromSearch)
    const tubeId = first.at(2)
    if (!tubeId || !tuberNameFromSearch) {
        return json({ good: false })
    }
    
    const tuberSubs = await ServerState.fetchTuberSubsFromId(tubeId)
    if(tuberSubs == undefined){
        return json({ good: false })
    }
    const tuberAdded : Utils.Tuber = {
        channelName:tuberNameFromSearch,
        channelId:tubeId,
        count:tuberSubs,
        countUpdatedAt: new Date().getTime()
    }
    ServerState.state.tubers.push(tuberAdded)
    ServerState.broadcast('tuberAdded',tuberAdded)
    const response: Utils.TubeResponse = {
        count: tuberSubs
    }

    return json(response);
};