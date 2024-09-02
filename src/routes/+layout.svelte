<script>
	import '../app.css';
	import { ModeWatcher, toggleMode } from 'mode-watcher';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Toaster } from '$lib/components/ui/sonner';
	import { Sun, Moon, GithubIcon } from 'lucide-svelte';
</script>

<Toaster position="bottom-center" richColors closeButton />
<ModeWatcher />

<div class="flex min-h-svh w-full justify-center p-2">
	<div class="flex-shrink flex-grow-0 basis-[35rem]">
		<div class="my-4 flex justify-end gap-2">
			<Button variant="ghost" class="p-2" href="https://github.com/namasSinjali/mafia-online">
				<GithubIcon />
			</Button>
			<Button variant="ghost" class="p-2" on:click={toggleMode}>
				<Sun class="inline dark:hidden" />
				<Moon class="hidden dark:inline" />
			</Button>
		</div>
		<div>
			<slot></slot>
		</div>
	</div>
</div>
