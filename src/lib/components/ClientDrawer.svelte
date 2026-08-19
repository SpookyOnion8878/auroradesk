<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import StatusBadge from './StatusBadge.svelte';
	import { clientOrders, sumAmountCents } from '$lib/domain/stats';
	import { formatCurrency, formatNumber } from '$lib/domain/money';
	import { formatDate } from '$lib/domain/dates';
	import type { Client, Order } from '$lib/domain/types';

	let {
		client = $bindable(null),
		orders = [],
		onEdit
	}: {
		client?: Client | null;
		orders?: Order[];
		onEdit?: (client: Client) => void;
	} = $props();

	let open = $derived(client !== null);

	const clientOrdersList = $derived(client ? clientOrders(orders, client.id) : []);
	const totalSpendCents = $derived(sumAmountCents(clientOrdersList));

	function close() {
		client = null;
	}

	function edit() {
		if (client) {
			onEdit?.(client);
			close();
		}
	}
</script>

<Sheet.Root {open} onOpenChange={(v) => !v && close()}>
	<Sheet.Content side="right" class="w-full overflow-y-auto sm:max-w-md">
		{#if client}
			<Sheet.Header>
				<div class="flex items-center gap-3">
					<div
						class="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
					>
						{client.name.slice(0, 2).toUpperCase()}
					</div>
					<div class="min-w-0">
						<Sheet.Title class="truncate">{client.name}</Sheet.Title>
						<div class="mt-1 flex items-center gap-2">
							<StatusBadge status={client.status} kind="client" />
							<span class="text-xs text-muted-foreground">{client.company || '—'}</span>
						</div>
					</div>
				</div>
				<Sheet.Description class="sr-only">Client details</Sheet.Description>
			</Sheet.Header>

			<div class="px-6 py-2">
				<div class="grid gap-2 rounded-xl border border-border bg-muted/30 p-4 text-sm">
					<div class="flex items-center justify-between gap-4">
						<span class="text-muted-foreground">Email</span>
						{#if client.email}
							<a href={`mailto:${client.email}`} class="truncate text-primary hover:underline">
								{client.email}
							</a>
						{:else}
							<span>—</span>
						{/if}
					</div>
					<div class="flex items-center justify-between gap-4">
						<span class="text-muted-foreground">Phone</span>
						{#if client.phone}
							<a href={`tel:${client.phone}`} class="text-primary hover:underline">
								{client.phone}
							</a>
						{:else}
							<span>—</span>
						{/if}
					</div>
					<div class="flex items-center justify-between gap-4">
						<span class="text-muted-foreground">Client since</span>
						<span>{formatDate(client.createdAt.slice(0, 10))}</span>
					</div>
				</div>

				<div class="mt-4 grid grid-cols-2 gap-3">
					<div class="rounded-xl border border-border bg-card p-3">
						<p class="text-xs text-muted-foreground">Total orders</p>
						<p class="mt-0.5 text-lg font-bold">{formatNumber(clientOrdersList.length)}</p>
					</div>
					<div class="rounded-xl border border-border bg-card p-3">
						<p class="text-xs text-muted-foreground">Total spend</p>
						<p class="mt-0.5 text-lg font-bold">{formatCurrency(totalSpendCents)}</p>
					</div>
				</div>

				<div class="mt-6">
					<h4 class="mb-2 text-sm font-semibold">Orders ({clientOrdersList.length})</h4>
					{#if clientOrdersList.length === 0}
						<p
							class="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground"
						>
							No orders for this client yet.
						</p>
					{:else}
						<ul class="space-y-2">
							{#each clientOrdersList as order (order.id)}
								<li
									class="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
								>
									<div class="min-w-0">
										<p class="truncate text-sm font-medium">{order.title}</p>
										<p class="text-xs text-muted-foreground">
											{order.orderId} · {formatDate(order.orderDate)}
										</p>
									</div>
									<div class="flex shrink-0 items-center gap-2">
										<span class="text-sm font-semibold">{formatCurrency(order.amountCents)}</span>
										<StatusBadge status={order.status} />
									</div>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>

			<Sheet.Footer class="px-6">
				<Button class="w-full" variant="outline" onclick={edit}>Edit client</Button>
			</Sheet.Footer>
		{/if}
	</Sheet.Content>
</Sheet.Root>
