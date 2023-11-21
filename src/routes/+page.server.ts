import type { PageServerLoad } from './$types';

export let ssr = false

export const load : PageServerLoad = (async (r) => {
	console.log('running page server load');
	return;

});