import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMsgSchema } from '$lib/utils';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import * as cheerio from 'cheerio';
import * as z from 'zod'

const searchResult = z.object({
    t:z.number(),
    list:z.array(
        z.array(z.string())
    )
})

export const POST: RequestHandler = async (requestEvent) => {
    let reqJson = await requestEvent.request.json()
    let parsed = Utils.tubeRequestSchema.safeParse(reqJson)
    if (!parsed.success) {
        return json({ good: false })
    }
    console.log('will process ' + parsed.data.channelName)
    
    const fetched = await fetch(`https://mixerno.space/api/youtube-channel-counter/search/${parsed.data.channelName}`)
    let fText = await fetched.json()
    // const parsedSearch = searchResult.safeParse(JSON.parse(fText))
    const parsedSearch = searchResult.safeParse(fText)
    if(!parsedSearch.success){
        console.log('failed parse search')
        return json({ good: false })
    }
    const first = parsedSearch.data.list.at(0)
    if(!first){
        console.log('failed search')
        return json({ good: false })
    }
    const tubeId = first.at(2)
    if(!tubeId){
        return json({ good: false })
    }
    console.log(tubeId)

    const usrfetched = await fetch(
        `https://mixerno.space/api/youtube-channel-counter/user/${tubeId}`,
        {
            headers: {
                'Accept': 'application/json',

            }
        }
    )
    // {
    //     t: 1699889033424,
    //     counts: [
    //       { value: 'subscribers', count: 76802 },
    let usrTxt = await usrfetched.json()
    const count = usrTxt['counts'][0]['count']
    console.log(usrTxt)
    console.log(count)


    return json({ good: true, count:count });
};