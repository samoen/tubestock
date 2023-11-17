import * as Kit from '@sveltejs/kit';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'
import * as Uuid from 'uuid'

export const GET: Kit.RequestHandler = async (event) => {
	// try {
	let usernameCookie = event.cookies.get('username');
	let uidCookie = event.cookies.get('uid');
	console.log(`stream requested by uid ${uidCookie}`);
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
		// ServerState.broadcastUserJoined(userJoined)
		// return json({ error: 'need uid cookie to start a stream' }, { status: 401 });
	}
	const foundUser = ServerState.state.users.findLast(u => u.uid == uidCookie);
	if (!foundUser) {
		console.log('cant subscribe user not found')
		event.cookies.delete('uid', { path: '/' })
		event.cookies.delete('username', { path: '/' })
		throw Kit.error(401, 'user not found');
	}
	if (foundUser.displayName != usernameCookie) {
		console.log('user not match ')
		event.cookies.delete('uid', { path: '/' })
		event.cookies.delete('username', { path: '/' })
		throw Kit.error(401, 'username cookie not matching uid cookie in user list');
	}
	if (
		foundUser.con != undefined
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
			foundUser.con = c;

			
			const theirPositions = ServerState.positionArrayToPosWithReturnValArray(foundUser.positions)
			const welcomeSub: Utils.WelcomeSubscriber = {
				users: ServerState.usersOnServerToClient(),
				tubers: ServerState.state.tubers,
				msgs: ServerState.state.msgs,
				positions: theirPositions,
				yourName: foundUser.displayName,
				yourIdleStock: foundUser.idleStock,
			}
			// setTimeout(() => {
			console.log('welcoming subscriber with ' + JSON.stringify(welcomeSub))
			c.enqueue(ServerState.encode('welcomeSubscriber', welcomeSub))
			if (userCreated) {
				ServerState.broadcastUserJoined(foundUser);
			}
			// }, 1);
		},
		cancel(reason) {
			console.log(`stream cancel handle for hero ${foundUser.displayName}`);
			if (reason) console.log(`reason: ${reason}`);
			foundUser.con = undefined;
			foundUser.stream = undefined;
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
