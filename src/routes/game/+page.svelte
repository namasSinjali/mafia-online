<script>
	import { onDestroy } from 'svelte';
	import { supabase } from '$lib/supabaseClient.js';
	import Host from '$lib/views/Host.svelte';
	import Join from '$lib/views/Join.svelte';

	/** @type {import('./$types').PageData} */
	export let data;

	const channel = supabase.channel(data.gameId, {
		config: {
			broadcast: {
				self: data.gameType == 'host'
			},
			presence: { key: data.username }
		}
	});

	channel.subscribe((status) => {
		if (status != 'SUBSCRIBED') {
			return null;
		}
		channel.track({
			user: data.username,
			isHost: data.gameType == 'host'
		});
	});

	onDestroy(() => {
		supabase.removeChannel(channel);
	});
</script>

{#if data.gameType == 'host'}
	<Host {channel} username={data.username} />
{:else if data.gameType == 'join'}
	<Join {channel} username={data.username} />
{/if}
