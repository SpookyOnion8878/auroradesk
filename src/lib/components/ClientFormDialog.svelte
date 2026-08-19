<script lang="ts">
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { api, ApiError } from '$lib/api';
	import { clientCreateSchema } from '$lib/domain/schemas';
	import type { Client } from '$lib/domain/types';
	import { cn } from '$lib/utils';

	let {
		open = $bindable(false),
		client = null,
		onSaved
	}: {
		open?: boolean;
		client?: Client | null;
		onSaved?: () => void;
	} = $props();

	const empty = { name: '', email: '', phone: '', company: '', status: 'active' as const };

	type ClientForm = Omit<typeof empty, 'status'> & {
		status: import('$lib/domain/types').ClientStatus;
	};
	let form = $state<ClientForm>({ ...empty });
	let fieldErrors = $state<Record<string, string>>({});
	let submitting = $state(false);

	$effect(() => {
		if (open) {
			form = client
				? {
						name: client.name,
						email: client.email,
						phone: client.phone,
						company: client.company,
						status: client.status
					}
				: { ...empty };
			fieldErrors = {};
		}
	});

	async function submit(e: SubmitEvent) {
		e.preventDefault();
		const parsed = clientCreateSchema.safeParse(form);
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
			if (client) {
				await api.clients.update(client.id, parsed.data);
				toast.success('Client updated');
			} else {
				await api.clients.create(parsed.data);
				toast.success('Client added');
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

	const inputClass = 'w-full bg-background [&[readonly]]:pointer-events-none';
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<form onsubmit={submit}>
			<Dialog.Header>
				<Dialog.Title>{client ? 'Edit Client' : 'Add Client'}</Dialog.Title>
				<Dialog.Description>
					{client ? 'Update the client details below.' : 'Add a new client to your store.'}
				</Dialog.Description>
			</Dialog.Header>

			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="client-name">Name</Label>
					<Input
						id="client-name"
						bind:value={form.name}
						placeholder="John Doe"
						class={cn(inputClass, fieldErrors.name && 'border-destructive')}
					/>
					{#if fieldErrors.name}
						<p class="text-xs text-destructive">{fieldErrors.name}</p>
					{/if}
				</div>

				<div class="grid gap-2">
					<Label for="client-email">Email</Label>
					<Input
						id="client-email"
						type="email"
						bind:value={form.email}
						placeholder="john@example.com"
						class={cn(inputClass, fieldErrors.email && 'border-destructive')}
					/>
					{#if fieldErrors.email}
						<p class="text-xs text-destructive">{fieldErrors.email}</p>
					{/if}
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div class="grid gap-2">
						<Label for="client-phone">Phone</Label>
						<Input
							id="client-phone"
							type="tel"
							bind:value={form.phone}
							placeholder="+1-555-0123"
							class={cn(inputClass, fieldErrors.phone && 'border-destructive')}
						/>
						{#if fieldErrors.phone}
							<p class="text-xs text-destructive">{fieldErrors.phone}</p>
						{/if}
					</div>
					<div class="grid gap-2">
						<Label for="client-company">Company</Label>
						<Input
							id="client-company"
							bind:value={form.company}
							placeholder="Acme Corp"
							class={cn(inputClass, fieldErrors.company && 'border-destructive')}
						/>
						{#if fieldErrors.company}
							<p class="text-xs text-destructive">{fieldErrors.company}</p>
						{/if}
					</div>
				</div>

				<div class="grid gap-2">
					<Label for="client-status">Status</Label>
					<select
						id="client-status"
						bind:value={form.status}
						class="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
					>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
						<option value="vip">VIP</option>
					</select>
				</div>
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
					{submitting ? 'Saving…' : client ? 'Save changes' : 'Add Client'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
