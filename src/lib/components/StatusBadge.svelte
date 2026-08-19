<script lang="ts">
	import { CLIENT_STATUS_META, ORDER_STATUS_META } from '$lib/domain/order-status';
	import type { ClientStatus, OrderStatus } from '$lib/domain/types';
	import { cn } from '$lib/utils';

	let {
		status,
		kind = 'order',
		class: className
	}: { status: string; kind?: 'order' | 'client'; class?: string } = $props();

	const meta = $derived(
		kind === 'order'
			? ORDER_STATUS_META[status as OrderStatus]
			: CLIENT_STATUS_META[status as ClientStatus]
	);
</script>

<span
	class={cn(
		'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
		meta?.badge ?? 'border-border bg-muted text-muted-foreground',
		className
	)}
>
	<span class="size-1.5 rounded-full" style:background-color={meta?.dot ?? 'currentColor'}></span>
	{meta?.label ?? status}
</span>
