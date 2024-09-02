import { supabase } from '$lib/supabaseClient.js';
import { browser } from '$app/environment';

// if (browser) {
//     const myChannel = supabase.channel('room-1', {
//         config: {
//             broadcast: { self: true },
//         },
//     })

//     myChannel.on(
//         'broadcast',
//         { event: 'test-my-messages' },
//         (payload) => console.log(payload)
//     )

//     myChannel.subscribe((status) => {
//         if (status !== 'SUBSCRIBED') { return }
//         let counter = 0;
//         myChannel.send({
//             type: 'broadcast',
//             event: 'test-my-messages',
//             payload: { message: 'talking to myself ' + counter },
//         })
//         counter++;
//     })
// }
