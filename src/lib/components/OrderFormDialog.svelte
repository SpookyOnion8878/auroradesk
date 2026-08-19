<script lang="ts">
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { api, ApiError } from '$lib/api';
	import { orderCreateSchema } from '$lib/domain/schemas';
	import { ORDER_STATUS_META } from '$lib/domain/order-status';
	import { todayIso } from '$lib/domain/dates';
	import type { Order } from '$lib/domain/types';
	import { cn } from '$lib/utils';

	let {
		open = $bindable(false),
		order = null,
		clients,
		onSaved
	}: {
		open?: boolean;
		order?: Order | null;
		clients: { id: string; name: string }[];
		onSaved?: () => void;
	} = $props();

	const empty = {
		orderId: '',
		title: '',
		clientId: '',
		amount: '',
		status: 'pending' as const,
		orderDate: todayIso()
	};

	type OrderForm = {
		orderId: string;
		title: string;
		clientId: string;
		amount: string;
		status: import('$lib/domain/types').OrderStatus;
		orderDate: string;
	};
	let form = $state<OrderForm>({ ...empty });
	let fieldErrors = $state<Record<string, string>>({});
	let submitting = $state(false);

	function generateOrderId() {
		const year = new Date().getFullYear();
		const rand = String(Math.floor(100 + Math.random() * 900));
		return `ORD-${year}-${rand}`;
	}

	$effect(() => {
		if (open) {
			form = order
				? {
						orderId: order.orderId,
						title: order.title,
						clientId: order.clientId,
						amount: String(order.amountCents / 100),
						status: order.status,
						orderDate: order.orderDate
					}
				: { ...empty, orderId: generateOrderId() };
			fieldErrors = {};
		}
	});

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		const parsed = orderCreateSchema.safeParse({
			...form,
			amount: form.amount === '' ? NaN : Number(form.amount)
		});
		if (!parsed.success) {
			const errors: Record<string, string> = {};
			for (const issue of parsed.error.issues) {
				const path = issue.path.join('.');
				if (!errors[path]) errors[path] = issue.message;
			}
			fieldErrors = errors;
			return;
		}

		submitting = true;
		try {
			if (order) {
				const patch = {
					orderId: parsed.data.orderId,
					title: parsed.data.title,
					clientId: parsed.data.clientId,
					amount: parsed.data.amount,
					orderDate: parsed.data.orderDate
				};
				await api.orders.update(order.id, patch);
				toast.success('Order updated');
			} else {
				await api.orders.create(parsed.data);
				toast.success('Order added');
			}
			open = false;
			onSaved?.();
		} catch (err) {
			if (err instanceof ApiError) {
				toast.error(err.message);
			} else {
				toast.error('Something went wrong');
			}
		} finally {
			submitting = false;
		}
	}

	const inputClass = 'w-full bg-background';
	const statusOptions = Object.entries(ORDER_STATUS_META);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<form onsubmit={submit}>
			<Dialog.Header>
				<Dialog.Title>{order ? 'Edit Order' : 'Add Order'}</Dialog.Title>
				<Dialog.Description>
					{order ? 'Update the order details below.' : 'Create a new order.'}
				</Dialog.Description>
			</Dialog.Header>

			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="order-id">Order ID</Label>
					<Input
						id="order-id"
						bind:value={form.orderId}
						placeholder="ORD-2026-001"
						class={cn(inputClass, fieldErrors.orderId && 'border-destructive')}
					/>
					{#if fieldErrors.orderId}
						<p class="text-xs text-destructive">{fieldErrors.orderId}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<Label for="order-title">Product / Service</Label>
					<Input
						id="order-title"
						bind:value={form.title}
						placeholder="Premium Software License"
						class={cn(inputClass, fieldErrors.title && 'border-destructive')}
					/>
					{#if fieldErrors.title}
						<p class="text-xs text-destructive">{fieldErrors.title}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<Label for="order-client">Client</Label>
					<select
						id="order-client"
						bind:value={form.clientId}
						class="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
						disabled={clients.length === 0}
					>
						<option value="" disabled>
							{clients.length === 0 ? 'Add a client first' : 'Select a client'}
						</option>
						{#each clients as client (client.id)}
							<option value={client.id}>{client.name}</option>
						{/each}
					</select>
					{#if fieldErrors.clientId}
						<p class="text-xs text-destructive">{fieldErrors.clientId}</p>
					{:else if clients.length === 0}
						<p class="text-xs text-muted-foreground">
							You need at least one client to create an order.
						</p>
					{/if}
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="order-amount">Amount ($)</Label>
						<Input
							id="order-amount"
							type="number"
							step="0.01"
							min="0.01"
							bind:value={form.amount}
							placeholder="1000.00"
							class={cn(inputClass, fieldErrors.amount && 'border-destructive')}
						/>
						{#if fieldErrors.amount}
							<p class="text-xs text-destructive">{fieldErrors.amount}</p>
						{/if}
					</div>
					<div class="grid gap-2">
						<Label for="order-date">Date</Label>
						<Input
							id="order-date"
							type="date"
							bind:value={form.orderDate}
							class={cn(inputClass, fieldErrors.orderDate && 'border-destructive')}
						/>
						{#if fieldErrors.orderDate}
							<p class="text-xs text-destructive">{fieldErrors.orderDate}</p>
						{/if}
					</div>
				</div>

				{#if !order}
					<div class="grid gap-2">
						<Label for="order-status">Status</Label>
						<select
							id="order-status"
							bind:value={form.status}
							class="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
						>
							{#each statusOptions as [value, meta] (value)}
								<option {value}>{meta.label}</option>
							{/each}
						</select>
					</div>
				{/if}
			</div>

			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					disabled={submitting}
					onclick={() => (open = false)}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={submitting}>
					{submitting ? 'Saving…' : order ? 'Save changes' : 'Add Order'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
