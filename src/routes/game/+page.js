import { redirect } from '@sveltejs/kit';
import { toast } from 'svelte-sonner';
/** @type {import('./$types').PageLoad} */
export function load({ url }) {
	let gameId = url.searchParams.get('id');
	let gameType = url.searchParams.get('type');
	// let username = url.searchParams.get('username');
	let username = localStorage.getItem('username');
	if (gameId && gameType && username) {
		return {
			gameId,
			gameType,
			username
		};
	}
	!gameId && toast.error('Please Enter Room ID');
	redirect(303, './');
}
