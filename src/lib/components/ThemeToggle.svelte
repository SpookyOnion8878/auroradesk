<script lang="ts">
	import { Moon, Sun } from '@lucide/svelte';

	let isLight = $state(false);

	$effect(() => {
		try {
			isLight = document.documentElement.classList.contains('light');
		} catch {
			isLight = false;
		}
	});

	function toggle() {
		isLight = !isLight;
		document.documentElement.classList.toggle('light', isLight);
		try {
			localStorage.setItem('sm-theme', isLight ? 'light' : 'dark');
		} catch {
			// localStorage tidak tersedia — tema tetap berlaku sesi ini
		}
	}
</script>

<button
	type="button"
	onclick={toggle}
	class="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground transition-all duration-200 hover:border-brand/50 hover:bg-brand/15 hover:text-foreground"
	aria-label={isLight ? 'Switch to dark theme' : 'Switch to dark theme'}
	title={isLight ? 'Switch to dark theme' : 'Switch to dark theme'}
>
	{#if isLight}
		<Sun class="size-4" />
	{:else}
		<Moon class="size-4" />
	{/if}
</button>
