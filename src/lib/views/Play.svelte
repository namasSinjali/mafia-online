<script>
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Toggle } from '$lib/components/ui/toggle';
	import * as Popover from '$lib/components/ui/popover';
	import {
		EyeIcon,
		ThumbsDownIcon,
		LocateIcon,
		BriefcaseMedicalIcon,
		Skull,
		CheckCircle2Icon,
		XCircleIcon,
		ShieldCheck
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	import { send as transitionSend, receive as transitionReceive } from '$lib/transition.js';
	import { scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';

	export let channel;
	export let finalizedPlayers;
	export let assignedRoles;
	export let gameState;
	export let gameTime;
	export let username;

	const isPlayer = finalizedPlayers.some((r) => r == username);
	console.log({ isPlayer });

	// $: [alivePlayers, deadPlayers] = finalizedPlayers.reduce((acc, k)=>{
	//     if (gameState[k].isAlive){
	//         acc[0].push(k);
	//     } else {
	//         acc[1].push(k);
	//     }
	//     return acc;
	// }, [[],[]]);

	let votes = {};
	$: votedBy = Object.keys(votes).reduce((acc, k, i) => {
		if (!votes[k]) return acc;
		if (!acc[votes[k]]) {
			acc[votes[k]] = [];
		}
		acc[votes[k]].push(k);
		return acc;
	}, {});

	let isRevealed = false;
	let revealTimeout;
	$: playerIndex = finalizedPlayers.reduce((acc, player, index) => {
		acc[player] = index;
		return acc;
	}, {});

	let votedPlayer = null;
	let targetedPlayer = null;
	let mafiaTargets = {};
	$: mafiaTargetedBy = Object.keys(mafiaTargets).reduce((acc, k, i) => {
		if (!mafiaTargets[k]) return acc;
		if (!acc[mafiaTargets[k]]) {
			acc[mafiaTargets[k]] = [];
		}
		acc[mafiaTargets[k]].push(k);
		return acc;
	}, {});
	let gameEnded = false;

	channel.on('broadcast', { event: 'update' }, ({ payload }) => {
		// if (currentEvent != 'play') return
		// if (finalizedPlayers.all(p=>p != payload.key)) return

		console.log(payload);
		if (payload.votes) votes = payload.votes;
		if (payload.gameState) gameState = payload.gameState;
		if (payload.gameTime) gameTime = payload.gameTime;
		if (payload.proceed) proceed(payload.gameTime);
		if (payload.gameEnded) gameEnded = payload.gameEnded;
	});

	if (assignedRoles[username] == 'mafia') {
		console.log('insert');
		channel.on('broadcast', { event: 'mafia-communicate' }, ({ payload }) => {
			if (assignedRoles[payload.key] == 'mafia') {
				mafiaTargets[payload.key] = payload.targetedPlayer;
			}
		});
	}

	$: {
		channel.send({
			type: 'broadcast',
			event: 'action',
			payload: { key: username, action: 'vote', votedPlayer }
		});
	}

	function handleReveal(checked = true) {
		isRevealed = checked;
		if (!checked) return;
		if (revealTimeout) clearTimeout(revealTimeout);
		revealTimeout = setTimeout(() => {
			isRevealed = false;
			clearTimeout(revealTimeout);
			revealTimeout = null;
		}, 3000);
	}
	function changeVote(key, checked) {
		if (gameState[key].isProtected) {
			votedPlayer = votedPlayer;
			toast.warning('The player can not be voted off.');
			return;
		}
		if (checked) {
			votedPlayer = key;
		} else {
			votedPlayer = null;
		}
	}
	function target(key) {
		handleReveal();
		switch (assignedRoles[username]) {
			case 'villager':
				break;
			case 'mafia':
				if (key == username) {
					toast.message('Cannot act upon self.');
					break;
				}
				if (targetedPlayer != key) {
					targetedPlayer = key;
					mafiaTargets[username] = key;
					channel.send({
						type: 'broadcast',
						event: 'action',
						payload: { key: username, action: 'kill', targetedPlayer }
					});
					channel.send({
						type: 'broadcast',
						event: 'mafia-communicate',
						payload: { key: username, targetedPlayer }
					});
				}
				break;
			case 'doctor':
				if (targetedPlayer != key) {
					targetedPlayer = key;
					channel.send({
						type: 'broadcast',
						event: 'action',
						payload: { key: username, action: 'heal', targetedPlayer }
					});
				}
				break;
			case 'prostitute':
				if (key == username) {
					toast.message('Cannot act upon self.');
					break;
				}
				if (targetedPlayer != key) {
					targetedPlayer = key;
					channel.send({
						type: 'broadcast',
						event: 'action',
						payload: { key: username, action: 'protect', targetedPlayer }
					});
				}
				break;
			case 'detective':
				if (key == username) {
					toast.message('Cannot act upon self.');
					break;
				}
				if (!targetedPlayer) {
					targetedPlayer = key;
				}
				break;
		}
	}
	function proceed(gameTime) {
		votes = {};
		votedPlayer = null;
		mafiaTargets = {};
		targetedPlayer = null;

		// if (gameTime == 'day'){
		//     let kill, protect, heal;
		//     for (let key in gameState){
		//         if (gameState[key].isKilled){
		//             kill = key;
		//         } else if (gameState[key].isHealed) {
		//             heal = key;
		//         } else if (gameState[key].isProtected) {
		//             protect = key;
		//         }
		//     }

		//     let description = "";
		//     if (kill) {
		//         if (heal == kill){
		//             description += `"${kill}" was attacked 💀 and healed.\n`;
		//         } else {
		//             description += `"${kill}" was attacked 💀.\n`;
		//             description += `"${heal}" was healed.\n`;
		//         }
		//     }
		//     description += `"${protect}" was slept with.\n`;

		//     toast.message("Night Outcome", {
		//         description
		//     })
		// }
	}
	function confirm() {
		if (isPlayer && gameState[username].isAlive) {
			channel.send({
				type: 'broadcast',
				event: 'action',
				payload: { key: username, action: 'confirm' }
			});
			toast.success('Confirmed');
		} else {
			toast.message('Not required');
		}
	}
</script>

<Card.Root class="color-scheme mx-auto max-w-sm bg-card">
	<Card.Header>
		<Card.Title class="capitalize" tag="h1">
			{gameTime} Time
		</Card.Title>
		<Card.Description>
			{gameTime == 'day' ? 'Vote player off' : 'Perform your secret role'}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="flex flex-col gap-2">
			{#each finalizedPlayers as key (key)}
				<!-- {#each Object.entries(gameState) as [key, value]} -->
				<!-- {#each gameState as value} -->
				<div
					animate:flip
					style="--my-color:var(--my-color-{playerIndex[key]})"
					class="{gameState[key].isAlive && isPlayer
						? 'order-1'
						: 'order-2 opacity-50'} relative grid h-12 w-full grid-cols-6 items-center rounded-sm border border-l-4 border-input border-l-[var(--my-color)] bg-primary-foreground bg-opacity-10 px-3 font-medium ring-offset-background"
				>
					<div class="col-span-3">
						<span class={gameState[key].isAlive ? '' : 'line-through'}>
							{key}
						</span>

						{#if (isRevealed && (username == key || (assignedRoles[username] == 'mafia' && assignedRoles[key] == 'mafia'))) || gameEnded}
							<Badge variant="outline">{assignedRoles[key]}</Badge>
						{/if}
					</div>
					<div class="flex">
						{#if gameState[key].isProtected}
							<ShieldCheck class="w-8 stroke-purple-500" />
						{/if}
						{#if gameState[key].isKilled}
							<Skull class="w-8" />
						{/if}
						{#if gameState[key].isHealed}
							<BriefcaseMedicalIcon class="w-8 stroke-green-500" />
						{/if}
					</div>
					<Popover.Root>
						<Popover.Trigger class="h-10 px-2">
							<div class="flex flex-nowrap *:-ml-1 first:*:m-0">
								{#each votedBy[key] ? votedBy[key] : [] as v}
									<Badge
										style="--my-color:var(--my-color-{playerIndex[v]})"
										class="h-3 w-3 border border-primary bg-[var(--my-color)] p-0 hover:bg-[var(--my-color)]"
									></Badge>
								{/each}
							</div>
						</Popover.Trigger>
						{#if votedBy[key] && votedBy[key].length > 0}
							<Popover.Content>
								<div class="color-scheme flex flex-wrap justify-evenly gap-1">
									{#each votedBy[key] ? votedBy[key] : [] as v (v)}
										<div in:scale animate:flip={{ duration: 600 }}>
											<Badge
												style="--my-color:var(--my-color-{playerIndex[v]})"
												class="bg-[var(--my-color)] hover:bg-[var(--my-color)]">{v}</Badge
											>
										</div>
									{/each}
								</div>
							</Popover.Content>
						{/if}
					</Popover.Root>
					{#if gameTime == 'day'}
						<Toggle
							class="group justify-self-end"
							pressed={votedPlayer == key}
							onPressedChange={(checked) => changeVote(key, checked)}
							disabled={!gameState[username]?.isAlive || !gameState[key]?.isAlive || !isPlayer}
						>
							<ThumbsDownIcon
								size="20"
								class="scale-110 transition duration-300 ease-in-out group-data-[state=on]:scale-125"
							/>
						</Toggle>
					{:else if gameTime == 'night'}
						<Button
							variant="secondary"
							class="group justify-self-end"
							on:click={() => target(key)}
							disabled={!gameState[username]?.isAlive || !gameState[key].isAlive || !isPlayer}
						>
							<LocateIcon
								size="20"
								class="scale-110 transition duration-300 ease-in-out group-data-[state=on]:scale-125"
							/>
						</Button>
					{/if}
					{#if isRevealed}
						<div class="absolute right-full flex h-12 w-5 flex-col justify-center">
							{#if assignedRoles[username] == 'mafia'}
								{#each mafiaTargetedBy[key] ? mafiaTargetedBy[key] : [] as v}
									<Skull
										style="--my-color:var(--my-color-{playerIndex[v]})"
										class="-mt-4 w-4 fill-[var(--my-color)] stroke-card first:m-0"
									/>
									<!-- <div style="--my-color:var(--my-color-{playerIndex[v]})" class="w-full h-1 bg-[var(--my-color)]"></div> -->
								{/each}
							{:else if assignedRoles[username] == 'doctor' && targetedPlayer == key}
								<BriefcaseMedicalIcon class="-mt-4 w-4 stroke-green-500 first:m-0" />
							{:else if assignedRoles[username] == 'detective' && targetedPlayer == key}
								{#if assignedRoles[key] == 'mafia'}
									<CheckCircle2Icon class="-mt-4 w-4 stroke-green-500 first:m-0" />
								{:else}
									<XCircleIcon class="-mt-4 w-4 stroke-red-500 first:m-0" />
								{/if}
							{:else if assignedRoles[username] == 'prostitute' && targetedPlayer == key}
								<ShieldCheck class="-mt-4 w-4 stroke-purple-500 first:m-0" />
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</Card.Content>
	<Card.Footer class="flex justify-between">
		<div class="flex gap-2">
			<Switch id="reveal" onCheckedChange={handleReveal} checked={isRevealed} />
			<Label for="reveal">
				<EyeIcon class={isRevealed ? '' : 'stroke-muted-foreground'} />
			</Label>
		</div>
		<Button on:click={confirm}>Confirm</Button>
	</Card.Footer>
</Card.Root>

<style>
	:global(.color-scheme) {
		--my-color-0: theme(colors.red.500);
		--my-color-1: theme(colors.orange.500);
		--my-color-2: theme(colors.yellow.400);
		--my-color-3: theme(colors.lime.400);
		--my-color-4: theme(colors.emerald.400);
		--my-color-5: theme(colors.teal.500);
		--my-color-6: theme(colors.cyan.600);
		--my-color-7: theme(colors.sky.400);
		--my-color-8: theme(colors.blue.500);
		--my-color-9: theme(colors.indigo.500);
		--my-color-10: theme(colors.violet.400);
		--my-color-11: theme(colors.purple.500);
		--my-color-12: theme(colors.fuchsia.400);
		--my-color-13: theme(colors.pink.500);
		--my-color-14: theme(colors.red.700);
		--my-color-15: theme(colors.orange.700);
		--my-color-16: theme(colors.yellow.700);
		--my-color-17: theme(colors.lime.700);
		--my-color-18: theme(colors.emerald.600);
		--my-color-19: theme(colors.teal.700);
		--my-color-20: theme(colors.sky.600);
		--my-color-21: theme(colors.blue.700);
		--my-color-22: theme(colors.indigo.700);
		--my-color-23: theme(colors.violet.600);
		--my-color-24: theme(colors.purple.700);
		--my-color-25: theme(colors.fuchsia.700);
		--my-color-26: theme(colors.pink.700);
	}
</style>
