<script>
	import { Toggle } from '$lib/components/ui/toggle';
	import { Separator } from '$lib/components/ui/separator';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import Play from './Play.svelte';
	import { toast } from 'svelte-sonner';

	import { send as transitionSend, receive as transitionReceive } from '$lib/transition.js';
	import { flip } from 'svelte/animate';

	export let channel;
	export let username;

	let currentEvent = 'preparation';

	let onlinePlayers = {};
	let selectedPlayers = [];
	$: unselectedPlayers = Object.keys(onlinePlayers).filter(
		(key) => !selectedPlayers.some((k) => k == key)
	);

	let rolesCount = {
		mafia: 1,
		detective: 1,
		doctor: 1,
		prostitute: 1,
		villager: 1
	};

	let finalizedPlayers = [];
	let assignedRoles = {};
	let gameTime = 'Day';
	let gameState = {};

	let warningToastId;
	channel
		.on('presence', { event: 'sync' }, () => {
			const presenceState = channel.presenceState();
			const temp = {};
			let anotherHost = false;
			for (let key in presenceState) {
				temp[key] = {
					...presenceState[key][0]
				};
				if (!onlinePlayers[key]) {
					if (temp[key].isHost) {
						if (anotherHost) {
							warningToastId != undefined && toast.dismiss(warningToastId);
							warningToastId = toast.warning('Two or more hosts in this room.', {
								duration: Number.POSITIVE_INFINITY
							});
						}
					}
				}
				anotherHost = temp[key].isHost || anotherHost;
			}
			onlinePlayers = temp;
			console.log({ onlinePlayers, unselectedPlayers });
		})
		.on('broadcast', { event: 'preparation' }, ({ payload }) => {
			currentEvent = 'preparation';
			if (payload.selectedPlayers) selectedPlayers = payload.selectedPlayers;
			if (payload.rolesCount) rolesCount = payload.rolesCount;
		})
		.on('broadcast', { event: 'play' }, ({ payload }) => {
			currentEvent = 'play';
			if (payload.finalizedPlayers) finalizedPlayers = payload.finalizedPlayers;
			if (payload.gameTime) gameTime = payload.gameTime;
			if (payload.gameState) gameState = payload.gameState;
			if (payload.assignedRoles) assignedRoles = payload.assignedRoles;
		});
</script>

{#if currentEvent == 'preparation'}
	<Card.Root class="mx-auto max-w-sm">
		<Card.Header>
			<Card.Title tag="h1">Waiting for Host to start...</Card.Title>
			<Card.Description>Settings set by host</Card.Description>
		</Card.Header>
		<Card.Content>
			<div>
				<h2 class="mb-4 font-semibold">Selected Players:</h2>
				<ul class="flex flex-col items-center">
					{#each selectedPlayers as key (key)}
						<li
							class="my-1 w-4/5 max-w-sm"
							in:transitionReceive={{ key }}
							out:transitionSend={{ key }}
							animate:flip={{ duration: 300 }}
						>
							<Toggle
								class="relative h-8 w-full disabled:opacity-100"
								disabled={true}
								pressed={true}
							>
								{key}
								{#if onlinePlayers[key].isHost}
									<Badge class="absolute right-2 bg-opacity-75">host</Badge>
								{/if}
							</Toggle>
						</li>
					{:else}
						<li class="text-center text-xs text-muted-foreground h-0">No Players Selected</li>
					{/each}
				</ul>
				<div class="ml-4 mt-4 text-xs text-muted-foreground">
					Selected: <span class="text-md font-bold">{selectedPlayers.length}</span> / {selectedPlayers.length +
						unselectedPlayers.length}
				</div>
				<Separator class="mb-4" />
				<ul class="flex flex-col items-center">
					{#each unselectedPlayers as key (key)}
						<li
							class="my-1 w-4/5 max-w-sm"
							in:transitionReceive={{ key }}
							out:transitionSend={{ key }}
							animate:flip={{ duration: 300 }}
						>
							<Toggle
								class="relative h-8 w-full disabled:opacity-100"
								disabled={true}
								pressed={false}
								variant="outline"
							>
								{key}
								{#if onlinePlayers[key].isHost}
									<Badge class="absolute right-2 bg-opacity-75">host</Badge>
								{/if}
							</Toggle>
						</li>
					{/each}
				</ul>
			</div>
			<div class="mt-6">
				<h2 class="mb-4 font-semibold">Customized Roles:</h2>
				<form class="grid grid-cols-2 space-y-1" action="javascript:void();">
					{#each Object.keys(rolesCount) as key}
						<div class="flex items-center gap-4">
							<span class="w-16 text-sm font-medium capitalize">{key}: </span>
							<span type="number" class="w-14 rounded border p-2 text-center shadow-sm"
								>{rolesCount[key]}</span
							>
						</div>
					{/each}
				</form>
			</div>
		</Card.Content>
		<Card.Footer class="flex justify-between">
			<Button variant="outline" href="./">Exit Room</Button>
		</Card.Footer>
	</Card.Root>
{:else if currentEvent == 'play'}
	<Play {finalizedPlayers} {assignedRoles} {username} {channel} {gameState} {gameTime} />
{/if}
