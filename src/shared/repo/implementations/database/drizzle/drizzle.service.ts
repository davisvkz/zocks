import type { Database, Where } from '@/repo/interfaces/database';
import type { SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { ConfigEnv, ConfigEnvSymbol } from '@/config/env';
import { DatabaseSymbol } from '@/repo/interfaces/database';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { container, inject, singleton } from 'tsyringe';

import { users } from './schemas';

const schemaMap = {
	users,
};

type SchemaTable = (typeof schemaMap)[keyof typeof schemaMap];

@singleton()
export class DrizzleDatabaseService implements Database {
	private database: NodePgDatabase<typeof schemaMap>;

	constructor(
		@inject(ConfigEnvSymbol)
		private env: ConfigEnv,
	) {
		this.database = drizzle(this.env.postgres.url, {
			schema: schemaMap,
		});
	}

	private getTable(table: string): SchemaTable {
		const tableSchema = schemaMap[table as keyof typeof schemaMap];
		if (tableSchema) {
			return tableSchema;
		}

		throw new Error(`Table ${table} not found`);
	}

	private mountWhere(table: string, where?: Where): SQL<unknown> | undefined {
		const entries = Object.entries(where ?? {});

		if (entries.length === 0) {
			return undefined;
		}

		const tableSchema = this.getTable(table);

		const conditions = entries.map(([key, value]) => {
			const column = (tableSchema as unknown as Record<string, unknown>)[key];

			if (
				!column ||
				typeof column !== 'object' ||
				!(column as { name?: string }).name
			) {
				throw new Error(`Column ${key} not found in table ${table}`);
			}

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return eq(column as any, value);
		});

		if (conditions.length === 1) {
			return conditions[0];
		}

		return and(...conditions);
	}

	async insert<T>(table: string, data: T): Promise<T> {
		const tableSchema = this.getTable(table);
		const result = await this.database
			.insert(tableSchema)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
			.values(data as unknown as any)
			.returning();

		return result[0] as T;
	}

	async find<T>(table: string, where?: Where): Promise<T | null> {
		const condition = this.mountWhere(table, where);

		const query = this.database.select().from(this.getTable(table));

		const result = condition ? await query.where(condition) : await query;

		if (result.length === 0) {
			return null;
		}

		return result[0] as T;
	}

	async findAll<T>(table: string, where?: Where): Promise<T[]> {
		const condition = this.mountWhere(table, where);

		const query = this.database.select().from(this.getTable(table));

		const result = condition ? await query.where(condition) : await query;

		return result as T[];
	}

	async update<T>(table: string, data: Partial<T>, where?: Where): Promise<T> {
		const condition = this.mountWhere(table, where);

		const query = this.database
			.update(this.getTable(table))
			.set(data as Record<string, unknown>);

		const result = condition
			? await query.where(condition).returning()
			: await query.returning();

		return result[0] as T;
	}

	async delete(table: string, where?: Where): Promise<void> {
		const condition = this.mountWhere(table, where);

		if (!condition) {
			throw new Error(`Delete sem 'where' em ${table} não é permitido`);
		}

		await this.database.delete(this.getTable(table)).where(condition);
	}
}

container.registerSingleton<Database>(DatabaseSymbol, DrizzleDatabaseService);
