import * as Drizzle from 'drizzle-orm'
import * as Postgres from 'pg'
import { env } from '$env/dynamic/private';

// When this file in edited in dev, sveltekit reruns it without cleaning up resources.
// To prevent multiple db connections we must detect this and exit
// looking for a better solution

console.log('running dbclient')

export const client = new Postgres.Client({
	host: env.DB_HOST,
	port: parseInt(env.DB_PORT),
	user: env.DB_USER,
	password: env.DB_PASSWORD,
	database: env.DB_NAME,
});
// console.log('we have exit listeners ' + process.listenerCount('exit')) 
// console.log('we have sigint listeners ' + process.listenerCount('SIGINT')) 
const exitListenerCount = process.listenerCount('exit')
if(exitListenerCount > 0){
    console.log('exiting because we have existing process listeners already')
    process.exit()
}
process.on('exit', () => {
    console.log('server exit')
    client.end()
})
process.on('SIGINT', () => {
    console.log('server SIGINT')
    client.end()
})
await client.connect();