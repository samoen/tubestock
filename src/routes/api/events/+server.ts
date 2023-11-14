import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as ServerState from '$lib/server/serverState'
import * as Utils from '$lib/utils'

export const GET: RequestHandler = async (request) => {
	try {
		const usernameCookie = request.cookies.get('username');
		const uidCookie = request.cookies.get('uid');
		console.log(`stream requested by: ${usernameCookie} uid ${uidCookie}`);
		if (!uidCookie) {
			return json({ error: 'need uid cookie to start a stream' }, { status: 401 });
		}
		const foundUser = ServerState.state.users.findLast(u=>u.uid == uidCookie);
		if (!foundUser) {
			return json({ error: 'user not found' }, { status: 401 });
		}
		if (foundUser.displayName != usernameCookie) {
			return json({ error: 'username cookie not matching uid cookie in user list' }, { status: 401 });
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
			}
		}
		foundUser.con = undefined
		foundUser.stream = undefined

		const rs = new ReadableStream({
			start(c) {
				foundUser.con = c;
				const welcomeSub : Utils.WelcomeSubscriber = {
					users: ServerState.state.users.map(u=>({displayName:u.displayName})),
					tubers: ServerState.state.tubers,
					msgs: ServerState.state.msgs,
				}
				// setTimeout(() => {
					c.enqueue(ServerState.encode('welcomeSubscriber',welcomeSub))
					// ServerState.broadcastUserSentMessage();
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
	} catch (e) {
		console.log('caught error during subscribe');
		console.error(e);
		return json({ oops: true }, { status: 500 });
	}
};
