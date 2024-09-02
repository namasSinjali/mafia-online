import { redirect } from '@sveltejs/kit';
/** @type {import('./$types').PageLoad} */
export function load({ url }) {
	let gameId = url.searchParams.get('id');
	let gameType = url.searchParams.get('type');
	let username = url.searchParams.get('username');
	// let username = localStorage.getItem('username');
	console.log({ gameId, gameType, username });
	if (gameId && gameType && username) {
		return {
			gameId,
			gameType,
			username
		};
	}

	redirect(303, '/');
}
