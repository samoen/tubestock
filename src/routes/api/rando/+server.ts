import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendMsgRequestSchema } from '$lib/utils';
import * as ServerState from '$lib/server/serverState'
import * as Schema from '$lib/server/schema'
import * as Utils from '$lib/utils'
import * as Uuid from 'uuid'
import { migrate } from "drizzle-orm/node-postgres/migrator";

export const POST: RequestHandler = async (event) => {
    // event.request.json
    try{
        let r = await migrate(ServerState.db, { migrationsFolder: './drizzle' });
    }catch(e){
        console.log('failed to migrate ' + String(e))
    }
    // try{
    //     await ServerState.db.insert(Schema.appusers).values({name:'ted'})

    // }catch(e){
    //     console.log('caught error during inserttt')
    // }

    // try{
    //     let r = await ServerState.db.select().from(Schema.appusers)
    //     console.log('heeerere' + JSON.stringify(r))
        

    // }catch(e){
    //     console.log('caught error during select')
    // }

    return json({});
};