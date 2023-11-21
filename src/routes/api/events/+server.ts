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

	let foundUser : ServerState.UserOnServer | undefined = undefined
	if (uidCookie && usernameCookie) {
		foundUser = ServerState.state.users.findLast(u => u.uid == uidCookie);
		if (!foundUser) {
			console.log('cant subscribe user not found')
			removeCookies()
		}else if (foundUser.displayName != usernameCookie) {
			console.log('user not match ')
			removeCookies()
			foundUser = undefined
		}
	}

	let userCreated = false
	if (!uidCookie) {
		uidCookie = Uuid.v4();
		usernameCookie = `Guest1`;
		for (let num = 1; num < 100; num++) {
			const nameTaken = ServerState.state.users.some((p) => p.displayName == `Guest${num}`);
			if (!nameTaken) {
				usernameCookie = `Guest${num}`;
				break;
			}
		}
		event.cookies.set('uid', uidCookie, { path: '/', secure: false });
		event.cookies.set('username', usernameCookie, { path: '/', secure: false });
		const userJoined: ServerState.UserOnServer = {
			stream: undefined,
			con: undefined,
			displayName: usernameCookie,
			uid: uidCookie,
			publicId: Uuid.v4(),
			idleStock: 100,
			positions: [],
		}

		ServerState.state.users.push(userJoined)
		userCreated = true
		foundUser = userJoined
		// ServerState.broadcastUserJoined(userJoined)
		// return json({ error: 'need uid cookie to start a stream' }, { status: 401 });
	}
	// const foundUser = ServerState.state.users.findLast(u => u.uid == uidCookie);
	if (!foundUser) {
		console.log('that should be impossible')
		throw Kit.error(401, 'the impossible happened');
	}
	const constFoundUser : ServerState.UserOnServer = foundUser
	if (
		constFoundUser.con != undefined
	) {
		console.log('subscriber is already subscribed, closing old one')
		// closing here causes infinite subscribe loops?
		try {
			foundUser.con?.close();
			await new Promise((resolve) => setTimeout(resolve, 100));
		} catch (e) {
			console.log('failed to close already subber');
			throw Kit.error(500, 'failed to close your old connection');
		}
	}
	foundUser.con = undefined
	foundUser.stream = undefined

	const rs = new ReadableStream({
		start(c) {
			constFoundUser.con = c;
			ServerState.broadcastEveryoneEverything()
		},
		cancel(reason) {
			console.log(`stream cancel handle for hero ${constFoundUser.displayName}`);
			if (reason) console.log(`reason: ${reason}`);
			constFoundUser.con = undefined;
			constFoundUser.stream = undefined;
			// ServerState.broadcastUserSentMessage();
		}
	});
	foundUser.stream = rs;
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
