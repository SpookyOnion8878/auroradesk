<script lang="ts">
	let {
		title,
		description,
		actions
	}: {
		title: string;
		description?: string;
		actions?: import('svelte').Snippet;
	} = $props();
</script>

<div
	class="mb-5 flex animate-in flex-col gap-3 duration-500 fade-in slide-in-from-bottom-2 sm:flex-row sm:items-end sm:justify-between"
>
	<div>
		<div class="accent-bar mb-2"></div>
		<h1 class="font-display text-3xl font-semibold tracking-tight">{title}</h1>
		{#if description}
			<p class="mt-1 text-sm text-muted-foreground">{description}</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex shrink-0 items-center gap-2">{@render actions()}</div>
	{/if}
</div>
