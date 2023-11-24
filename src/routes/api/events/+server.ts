import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import * as Uuid from 'uuid'

export const GET: Kit.RequestHandler = async (event) => {
	// try {
	await ServerState.fakeLatency()
	let usernameCookie = event.cookies.get('username');
	let uidCookie = event.cookies.get('uid');
	console.log(`stream requested with cookie username ${usernameCookie}`);

	const removeCookies = ()=>{
		event.cookies.delete('uid', { path: '/' })
		event.cookies.delete('username', { path: '/' })
		uidCookie = undefined
		usernameCookie = undefined
	}

	if(!uidCookie || !usernameCookie){
		removeCookies()
	}

	let foundDbUser : ServerState.UserInDb | undefined = undefined
	if (uidCookie && usernameCookie) {
		foundDbUser = ServerState.dbGetUserByPrivateId(uidCookie);
		
		if (!foundDbUser) {
			console.log('user not found from cookies')
			removeCookies()
		}else if (foundDbUser.displayName != usernameCookie) {
			console.log('user not match')
			removeCookies()
			foundDbUser = undefined
		}
	}

	let userCreated = false
	if (!foundDbUser) {
		console.log('creating user')
		userCreated = true
		uidCookie = Uuid.v4();
		usernameCookie = `Guest`;
		// for (let num = 1; num < 100; num++) {
		// 	const nameTaken = ServerState.state.usersInDb.some((p) => p.displayName == `Guest${num}`);
		// 	if (!nameTaken) {
		// 		usernameCookie = `Guest${num}`;
		// 		break;
		// 	}
		// }
		event.cookies.set('uid', uidCookie, { path: '/', secure: false });
		event.cookies.set('username', usernameCookie, { path: '/', secure: false });
		const usrCreate: ServerState.UserCreateProps = {
			privateId: uidCookie,
			// publicId: Uuid.v4(),
			displayName: usernameCookie,
			// idleStock: 100,
		}

		foundDbUser = await ServerState.dbInsertUser(usrCreate)
	}

	if (!foundDbUser) {
		console.log('that should be impossible')
		throw Kit.error(401, 'the impossible happened');
	}

	
	const constFoundUser : ServerState.UserInDb = foundDbUser


	const didFind = Utils.findRunRemove(
		ServerState.state.usersInMemory,
		(u)=>u.dbId == constFoundUser.pKey,
		(u)=>{
			Utils.runCatching(()=>u.con?.close())
			console.log('subscriber was already subscribed, closed old one')
		}
	)

	// wait a bit?
	// if (didFind) {
		// await new Promise((resolve) => setTimeout(resolve, 100));
	// }

	const rs = new ReadableStream({
		start(c) {
			let newMemUsr : ServerState.UserInMemory = {
				dbId:constFoundUser.pKey,
				con:c,
			}
			ServerState.state.usersInMemory.push(newMemUsr)
			// ServerState.broadcastEveryoneWorld()
			// console.log('created user subscribed and started')
			let world : Utils.WorldEvent = {
				
			}
			if(userCreated){
				world.yourIdleStock=constFoundUser.idleStock
				world.yourName=constFoundUser.displayName
				world.yourPrivateId=constFoundUser.privateId
			}
			ServerState.sendToUser(newMemUsr,'world',world)

			if(userCreated){
				let worldBroad : Utils.WorldEvent = {
					users : ServerState.usersOnServerToClient()
				}
				ServerState.broadcast('world',worldBroad)
			}
		},
		cancel(reason) {
			console.log(`stream cancel handle for hero ${constFoundUser.displayName}`);
			if (reason) console.log(`reason: ${reason}`);
			ServerState.state.usersInMemory.filter(u => u.dbId != constFoundUser.pKey);	
		}
	});
	// foundMemUser.stream = rs;
	return new Response(rs, {
		headers: {
			// connection: 'keep-alive',
			'cache-control': 'no-store',
			'content-type': 'text/event-stream'
		}
	});
	// } catch (e) {
	// console.error(e);
	// return Kit.error(500,'failed to subscribe');
	// }
};
