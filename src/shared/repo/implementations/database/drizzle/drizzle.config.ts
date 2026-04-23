import 'dotenv/config';

import { defineConfig } from 'drizzle-kit';

if (!process.env.POSTGRES_URL) {
	console.error('❌ Environment variable POSTGRES_URL is not set');
	process.exit(1);
}

export default defineConfig({
	schema: './drizzle.config.ts',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.POSTGRES_URL,
	},
});
