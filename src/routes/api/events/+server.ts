import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import * as Uuid from 'uuid'
import * as Schema from '$lib/server/schema';

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

	let foundDbUser : Schema.AppUser | undefined = undefined
	if (uidCookie && usernameCookie) {
		foundDbUser = await ServerState.dbGetUserByPrivateId(uidCookie);
		
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
		let genSecret = Uuid.v4()
		let guestName = 'Guest'
		const usrCreate: Schema.InsertAppUser = {
			secret: genSecret,
			displayName: guestName,
			idleStock:100,
			publicId:Uuid.v4(),
		}

		foundDbUser = await ServerState.dbInsertUser(usrCreate)
		// uidCookie = Uuid.v4();
		// usernameCookie = `Guest`;
		// for (let num = 1; num < 100; num++) {
		// 	const nameTaken = ServerState.state.usersInDb.some((p) => p.displayName == `Guest${num}`);
		// 	if (!nameTaken) {
		// 		usernameCookie = `Guest${num}`;
		// 		break;
		// 	}
		// }
		event.cookies.set('uid', foundDbUser.secret, { path: '/', secure: false });
		event.cookies.set('username', foundDbUser.displayName, { path: '/', secure: false });
	}

	if (!foundDbUser) {
		console.log('that should be impossible')
		throw Kit.error(401, 'the impossible happened');
	}

	
	const constFoundUser : Schema.AppUser = foundDbUser


	const didFind = Utils.findRunRemove(
		ServerState.state.usersInMemory,
		(u)=>u.dbId == constFoundUser.id,
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
		async start(c) {
			let newMemUsr : ServerState.UserInMemory = {
				dbId:constFoundUser.id,
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
				world.yourPrivateId=constFoundUser.secret
			}
			ServerState.sendToUser(newMemUsr,'world',world)

			if(userCreated){
				const cUsrs = await ServerState.usersOnServerToClient()
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
