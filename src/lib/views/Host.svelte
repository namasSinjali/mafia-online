<script>
	import { onMount, onDestroy } from 'svelte';
	import { Toggle } from '$lib/components/ui/toggle';
	import { Separator } from '$lib/components/ui/separator';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Badge } from '$lib/components/ui/badge';
	import Play from './Play.svelte';
	import { toast } from 'svelte-sonner';

	import { send as transitionSend, receive as transitionReceive } from '$lib/transition.js';
	import { flip } from 'svelte/animate';
	import { supabase } from '$lib/supabaseClient.js';

	export let channel;
	export let username;

	let onlinePlayers = {};
	let selectedPlayers = [];
	let unselectedPlayers = [];

	let rolesCount = {
		detective: 1,
		doctor: 1,
		mafia: 1,
		prostitute: 1,
		villager: 1
	};

	let currentEvent = 'preparation';
	let finalizedPlayers = [];
	let assignedRoles = {};
	let gameTime = 'day';
	let gameState = {};
	let action = {
		killed: null,
		healed: null,
		protected: null
	};
	let playersConfirmed = {};
	$: nPlayersConfirmed = Object.values(playersConfirmed).reduce((acc, v) => acc + v, 0);
	let votes = {};
	$: playersAlive = Object.keys(gameState).filter((k) => gameState[k].isAlive);
	let gameEnded = false;

	$: {
		const selected = [];
		const unselected = [];
		for (let key in onlinePlayers) {
			if (onlinePlayers[key].isSelected) {
				selected.push(key);
			} else {
				unselected.push(key);
			}
		}
		selectedPlayers = selected;
		unselectedPlayers = unselected;
	}

	let warningToastId;
	channel
		.on('presence', { event: 'sync' }, () => {
			const presenceState = channel.presenceState();
			const temp = {};
			let anotherHost = false;
			for (let key in presenceState) {
				if (onlinePlayers[key]) {
					temp[key] = onlinePlayers[key];
				} else {
					temp[key] = {
						...presenceState[key][0],
						isSelected: false
					};
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
		})
		.on('broadcast', { event: 'action' }, ({ payload }) => {
			if (finalizedPlayers.every((p) => p != payload.key)) return;
			switch (payload.action) {
				case 'vote':
					votes[payload.key] = payload.votedPlayer;
					break;
				case 'kill':
					if (assignedRoles[payload.key] == 'mafia') {
						action.killed = payload.targetedPlayer;
					}
					break;
				case 'heal':
					if (assignedRoles[payload.key] == 'doctor') {
						action.healed = payload.targetedPlayer;
					}
					break;
				case 'protect':
					if (assignedRoles[payload.key] == 'prostitute') {
						action.protected = payload.targetedPlayer;
					}
					break;
				case 'confirm':
					if (playersAlive.some((p) => p == payload.key)) {
						playersConfirmed[payload.key] = true;
					}
			}
		});

	$: {
		channel.send({
			type: 'broadcast',
			event: currentEvent,
			payload: { selectedPlayers, rolesCount }
		});
	}
	$: {
		channel.send({
			type: 'broadcast',
			event: 'update',
			payload: { gameTime }
		});
	}
	$: {
		channel.send({
			type: 'broadcast',
			event: 'update',
			payload: { votes }
		});
	}
	$: {
		channel.send({
			type: 'broadcast',
			event: 'update',
			payload: { gameEnded }
		});
	}

	function startGame() {
		finalizedPlayers = selectedPlayers;
		const shuffledRoles = Object.keys(rolesCount).reduce(
			(acc, r) => acc.concat(Array(parseInt(rolesCount[r])).fill(r)),
			[]
		);
		gameState = {};
		assignedRoles = {};
		if (shuffledRoles.length != finalizedPlayers.length) {
			toast.error('Unequal number of selected players and roles set.');
			return;
		}
		for (let i = shuffledRoles.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffledRoles[i], shuffledRoles[j]] = [shuffledRoles[j], shuffledRoles[i]];
		}
		finalizedPlayers.forEach((p, i) => {
			assignedRoles[p] = shuffledRoles[i];
			gameState[p] = { isAlive: true, isKilled: false, isProtected: false, isHealed: false };
		});
		// gameState = finalizedPlayers.map((p, i)=> ({username:p, isAlive:true, role:shuffledRoles[i]}))
		channel.send({
			type: 'broadcast',
			event: 'play',
			payload: { gameTime, finalizedPlayers, assignedRoles, gameState }
		});
		gameTime = 'day';
		currentEvent = 'play';
		gameEnded = false;
	}

	function proceed(event, force = false) {
		if (!force && nPlayersConfirmed < playersAlive.length) {
			console.log('adsf');
			toast('All players have not confirmed. Do you still want to proceed?', {
				action: {
					label: 'Proceed',
					onClick: () => proceed(event, true)
				}
			});
			return;
		}
		playersConfirmed = {};
		if (gameTime == 'day') {
			Object.values(gameState).forEach((v) => {
				v.isHealed = false;
				v.isProtected = false;
				v.isKilled = false;
			});
			const voteCount = playersAlive.reduce((acc, k) => {
				acc[k] = 0;
				return acc;
			}, {});
			Object.values(votes).forEach((k) => {
				if (k) voteCount[k]++;
			});
			const maxVotes = Math.max(...Object.values(voteCount));
			if (maxVotes > 0) {
				const candidates = Object.keys(voteCount).filter((k) => voteCount[k] == maxVotes);
				const votedOff = candidates[Math.floor(Math.random() * candidates.length)];
				gameState[votedOff].isAlive = false;
			}

			votes = {};

			gameTime = 'night';
			action = {
				killed: null,
				healed: null,
				protected: null
			};
		} else if (gameTime == 'night') {
			console.log({ assignedRoles, playersAlive, action });
			for (let key of playersAlive) {
				if (assignedRoles[key] == 'mafia' && !action.killed) {
					toast.message('Mafia has not played yet.');
					return;
				}
				if (assignedRoles[key] == 'doctor' && !action.healed) {
					console.log('doctor');
					toast.message('Doctor has not played yet.');
					return;
				}
				if (assignedRoles[key] == 'prostitute' && !action.protected) {
					toast.message('Prostitute has not played yet.');
					console.log('prostitute');
					return;
				}
			}
			if (action.killed) {
				gameState[action.killed].isKilled = true;
				gameState[action.killed].isAlive = action.killed == action.healed;
			}
			if (action.healed) {
				gameState[action.healed].isHealed = true;
			}
			if (action.protected) {
				gameState[action.protected].isProtected = true;
			}

			gameTime = 'day';
			votes = {};
		}
		channel.send({
			type: 'broadcast',
			event: 'update',
			payload: { proceed: true, gameTime, gameState }
		});
	}
	function endGame() {
		gameEnded = true;
	}
	function newGame() {
		currentEvent = 'preparation';
	}
</script>

{#if currentEvent == 'preparation'}
	<Card.Root class="mx-auto max-w-sm bg-card">
		<Card.Header>
			<Card.Title tag="h1">Settings</Card.Title>
			<Card.Description>Players online in room</Card.Description>
		</Card.Header>
		<Card.Content>
			<div>
				<h2 class="mb-4 font-semibold">Select Players:</h2>
				<ul class="flex flex-col items-center">
					{#each selectedPlayers as key (key)}
						<li
							class="my-1 w-4/5 max-w-sm"
							in:transitionReceive={{ key }}
							out:transitionSend={{ key }}
							animate:flip={{ duration: 300 }}
						>
							<Toggle
								class="relative h-8 w-full"
								pressed
								onPressedChange={(checked) => {
									onlinePlayers[key].isSelected = checked;
								}}
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
				<div>
					<div class="ml-4 mt-4 text-xs text-muted-foreground">
						Selected: <span class="text-md font-bold">{selectedPlayers.length}</span> / {selectedPlayers.length +
							unselectedPlayers.length}
					</div>
					<Separator class="mb-4" />
				</div>
				<ul class="flex flex-col items-center">
					{#each unselectedPlayers as key (key)}
						<li
							class="my-1 w-4/5 max-w-sm"
							in:transitionReceive={{ key }}
							out:transitionSend={{ key }}
							animate:flip={{ duration: 300 }}
						>
							<Toggle
								class="relative h-8 w-full"
								pressed={false}
								onPressedChange={(checked) => {
									onlinePlayers[key].isSelected = checked;
								}}
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
				<h2 class="mb-4 font-semibold">Customize Roles:</h2>
				<form class="grid grid-cols-2 space-y-1" action="javascript:void();">
					{#each Object.keys(rolesCount) as key}
						<div class="flex items-center gap-2">
							<Label class="w-16 capitalize">{key}:</Label>
							<Input type="number" class="w-14" bind:value={rolesCount[key]} min="0"></Input>
						</div>
					{/each}
				</form>
				<div class="ml-4 mt-4 text-xs text-muted-foreground">
					Total: <span class="text-md font-bold"
						>{Object.values(rolesCount).reduce((acc, v) => acc + parseInt(v), 0)}</span
					>
				</div>
			</div>
		</Card.Content>
		<Card.Footer class="flex justify-between">
			<Button on:click={startGame}>Start Game</Button>
			<Button variant="outline" href="../">Exit Room</Button>
		</Card.Footer>
	</Card.Root>
{:else if currentEvent == 'play'}
	<div class="mx-auto mb-8 flex max-w-sm items-center gap-4 rounded-md border bg-card p-2">
		<!-- <div>
        <Toggle pressed={gameTime=='day'} disabled={gameTime=='day'} onPressedChange={checked=>{gameTime=checked?'day':'night';}} size="sm" class="disabled:opacity-100">Day</Toggle>
        <Toggle pressed={gameTime=='night'} disabled={gameTime=='night'} onPressedChange={checked=>{gameTime=checked?'night':'day'}} size="sm" class="disabled:opacity-100">Night</Toggle>
    </div> -->
		<Button on:click={proceed}>Proceed: {nPlayersConfirmed}/{playersAlive.length}</Button>
		{#if gameEnded}
			<Button on:click={newGame}>New Game</Button>
		{:else}
			<Button on:click={endGame}>End Game</Button>
		{/if}
	</div>
	<Play {finalizedPlayers} {assignedRoles} {username} {channel} {gameState} {gameTime} />
{/if}
