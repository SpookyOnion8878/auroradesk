<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		title = 'Nothing here yet',
		description,
		action,
		class: className
	}: {
		title?: string;
		description?: string;
		action?: import('svelte').Snippet;
		class?: string;
	} = $props();
</script>

<div
	class={cn(
		'flex animate-in flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center zoom-in-95 fade-in',
		className
	)}
>
	<div
		class="text-gradient flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/20 to-accent/20 ring-1 ring-brand/30"
	>
		{@render icon?.()}
	</div>
	<div class="space-y-1">
		<p class="text-sm font-medium text-foreground">{title}</p>
		{#if description}
			<p class="max-w-sm text-sm text-muted-foreground">{description}</p>
		{/if}
	</div>
	{#if action}
		<div class="mt-1">{@render action()}</div>
	{/if}
</div>

{#snippet icon()}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="size-6"
	>
		<path d="M3 7V5a2 2 0 0 1 2-2h2" />
		<path d="M17 3h2a2 2 0 0 1 2 2v2" />
		<path d="M21 17v2a2 2 0 0 1-2 2h-2" />
		<path d="M7 21H5a2 2 0 0 1-2-2v-2" />
		<circle cx="12" cy="12" r="3" />
	</svg>
{/snippet}
