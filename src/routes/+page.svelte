<script>
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Popover from '$lib/components/ui/popover';

	import Pencil from 'lucide-svelte/icons/pencil';

	// let username = localStorage.getItem("username");
	let username;
	if (!username) {
		username = 'User#' + Math.floor(Math.random() * 1000);
	}
	// $: {localStorage.setItem("username", username)}
	let newUsername = username;

	let popoverOpen = false;
	let gameId;

	let searchParams = {};
	$: {
		searchParams = {};
		if (gameId) searchParams.id = gameId;
		searchParams.username = username;
	}

	function changeUsername(e) {
		if (newUsername) {
			username = newUsername;
		}
		popoverOpen = false;
	}
</script>

<Card.Root class="mx-auto max-w-sm">
	<Card.Header>
		<Card.Title tag="h1">
			<span>
				Hello {username}
			</span>
			<Popover.Root bind:open={popoverOpen}>
				<Popover.Trigger class="align-top">
					<Pencil size="12" />
				</Popover.Trigger>
				<Popover.Content>
					<form action="javascript:void(0);" on:submit={changeUsername} class="space-y-3">
						<h2 class="mb-2 text-lg font-bold">Change Username</h2>
						<div class="flex flex-col space-y-2.5">
							<Label for="new-username">New Username</Label>
							<Input id="new-username" placeholder={username} bind:value={newUsername} />
						</div>
						<div>
							<Button on:click={changeUsername}>Enter</Button>
						</div>
					</form>
				</Popover.Content>
			</Popover.Root>
		</Card.Title>
		<Card.Description>Become host or join.</Card.Description>
	</Card.Header>
	<Card.Content>
		<form>
			<div class="flex flex-col space-y-1.5">
				<Label for="game_id">Game Id</Label>
				<Input id="game_id" bind:value={gameId} placeholder="Enter Game Id" />
			</div>
		</form>
	</Card.Content>
	<Card.Footer class="flex justify-between">
		<Button href={'./game?' + new URLSearchParams({ ...searchParams, type: 'host' }).toString()}
			>Host</Button
		>
		<Button
			href={'./game?' + new URLSearchParams({ ...searchParams, type: 'join' }).toString()}
			variant="outline">Join</Button
		>
	</Card.Footer>
</Card.Root>
