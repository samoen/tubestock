import * as ServerState from '$lib/server/serverState';
import * as Utils from '$lib/utils';
import type { PageServerLoad } from './$types';

// This runs on the server once when the page is first requested
export const load = (async (r) => {
	console.log('running page server load');
	const dtl: Utils.DataFirstLoad = {};

	// const uidCookie = r.cookies.get('uid');
	// const usernameCookie = r.cookies.get('username');
	// if (!uidCookie) {
	// 	r.cookies.delete('uid')
	// 	r.cookies.delete('username')
	// 	dtl.cookieMissing = true;
	// 	return dtl;
	// }

	// const foundUser = ServerState.state.users.findLast(u=>u.uid == uidCookie);
	// if (!foundUser) {
	// 	console.log(
	// 		`uid cookie ${uidCookie} not present in player list`
	// 	);
	// 	r.cookies.delete('uid')
	// 	r.cookies.delete('username')
	// 	dtl.noPlayer = true;
	// 	return dtl;
	// }
	// if (foundUser.displayName != usernameCookie) {
	// 	dtl.noMatch = true;
	// 	return dtl;
	// }

	dtl.readyToSubscribe = true;
	// dtl.username = foundUser.displayName
	// dtl.idleStock = foundUser.idleStock
	return dtl;

}) satisfies PageServerLoad;