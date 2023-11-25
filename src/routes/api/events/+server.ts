import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import * as Uuid from 'uuid'
import * as Schema from '$lib/server/schema';

export const GET: Kit.RequestHandler = async (event) => {
	await ServerState.fakeLatency()

	let foundDbUser : Schema.AppUser | undefined = undefined
	try{
		foundDbUser = await ServerState.getUserFromEvent(event)
		console.log(`${foundDbUser.displayName} is subscribing`);
	}catch(e){
		console.log('someone subscribing with no user')
	}
	
	let userCreated = false
	if (!foundDbUser) {
		console.log('creating user')
		userCreated = true
		let genSecret = Uuid.v4()
		let genGuestName = 'Guest'
		// for (let num = 1; num < 100; num++) {
		// 	const nameTaken = ServerState.state.usersInDb.some((p) => p.displayName == `Guest${num}`);
		// 	if (!nameTaken) {
		// 		usernameCookie = `Guest${num}`;
		// 		break;
		// 	}
		// }
		const usrCreate: Schema.InsertAppUser = {
			secret: genSecret,
			displayName: genGuestName,
			idleStock:100,
		}

		foundDbUser = await ServerState.dbInsertUser(usrCreate)
		event.cookies.set('uid', foundDbUser.secret, { path: '/', secure: false });
		event.cookies.set('username', foundDbUser.displayName, { path: '/', secure: false });
	}

	if (!foundDbUser) {
		console.log('That should be impossible')
		throw Kit.error(500, 'Failed to generate a user');
	}
	const constFoundUser : Schema.AppUser = foundDbUser

	// If they are already subscribed, close it
	const didFind = Utils.findRunRemove(
		ServerState.state.usersInMemory,
		(u)=>u.dbId == constFoundUser.id,
		(u)=>{
			Utils.runCatching(()=>u.con?.close())
			console.log('subscriber was already subscribed, closed old one and removed')
		}
	)

	// wait a bit?
	// if (didFind) {
		// await new Promise((resolve) => setTimeout(resolve, 100));
	// }

	const rs = new ReadableStream({
		async start(c) {
			let newMemUsr : ServerState.UserInMemory = {
				dbId:constFoundUser.id,
				con:c,
			}
			ServerState.state.usersInMemory.push(newMemUsr)
			let world : Utils.WorldEvent = {}
			if(userCreated){
				world.yourIdleStock=constFoundUser.idleStock
				world.yourName=constFoundUser.displayName
				world.yourPrivateId=constFoundUser.secret
			}
			// send at least an empty event to open their EventSource
			ServerState.sendToUser(newMemUsr,'world',world)

			if(userCreated){
				// broadcast a new user was created
				const cUsrs = await ServerState.betterUsersOnServerToClient()
				let worldBroad : Utils.WorldEvent = {
					users : cUsrs
				}
				ServerState.broadcast('world',worldBroad)
			}
		},
		cancel(reason) {
			console.log(`stream cancel handle for hero ${constFoundUser.displayName}`);
			if (reason) console.log(`reason: ${reason}`);
			ServerState.state.usersInMemory.filter(u => u.dbId != constFoundUser.id);	
		}
	});

	return new Response(rs, {
		headers: {
			// connection: 'keep-alive',
			'cache-control': 'no-store',
			'content-type': 'text/event-stream'
		}
	});
};
