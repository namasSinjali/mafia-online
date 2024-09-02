<script>
	import { supabase } from '$lib/supabaseClient.js';
	import { Button } from '$lib/components/ui/button/index.js';

	const myChannel = supabase.channel('room-1', {
		// config: {
		//     broadcast: { self: true },
		// },
	});

	myChannel
		.on('broadcast', { event: 'test-my-messages' }, (payload) => console.log(payload))
		.subscribe();

	function sendData() {
		myChannel.send({
			type: 'broadcast',
			event: 'test-my-messages',
			payload: { message: 'talking to myself ' }
		});
	}
</script>

<Button on:click={sendData}>Send</Button>
