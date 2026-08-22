import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit()
	],
	test: {
		expect: { requireAssertions: true },
		// Root project TIDAK boleh mengumpulkan test — hanya proyek 'server' yang menjalankan.
		// (Tanpa ini file test dieksekusi dua kali dalam proses yang sama dan state DB saling menumpuk.)
		include: [],
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					setupFiles: ['./vitest.setup.ts'],
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
