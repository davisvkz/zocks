import type { Database, Where } from '../../../interfaces/database';

type Row = Record<string, unknown>;

export class MockDatabaseRepo implements Database {
	private tables = new Map<string, Row[]>();

	private getTable(table: string): Row[] {
		if (!this.tables.has(table)) {
			this.tables.set(table, []);
		}

		return this.tables.get(table) ?? [];
	}

	private matchesWhere(row: Row, where?: Where): boolean {
		if (!where) return true;
		return Object.entries(where).every(([key, value]) => row[key] === value);
	}

	async insert<T>(table: string, data: T): Promise<T> {
		const rows = this.getTable(table);
		rows.push(data as Row);
		this.tables.set(table, rows);
		return data;
	}

	async find<T>(table: string, where?: Where): Promise<T | null> {
		const rows = this.getTable(table);

		if (!where) {
			return (rows[0] ?? null) as T | null;
		}

		const found = rows.find((row) => this.matchesWhere(row, where));
		return (found ?? null) as T | null;
	}

	async findAll<T>(table: string, where?: Where): Promise<T[]> {
		const rows = this.getTable(table);

		if (!where) {
			return [...rows] as T[];
		}

		return rows.filter((row) => this.matchesWhere(row, where)) as T[];
	}

	async update<T>(table: string, data: Partial<T>, where?: Where): Promise<T> {
		const rows = this.getTable(table);

		const index = rows.findIndex((row) => this.matchesWhere(row, where));

		if (index === -1) {
			throw new Error(`No rows matched "where" in ${table}`);
		}

		rows[index] = {
			...rows[index],
			...(data as Row),
		};

		this.tables.set(table, rows);
		return rows[index] as T;
	}

	async delete(table: string, where?: Where): Promise<void> {
		const rows = this.getTable(table);

		if (!where) {
			this.tables.set(table, []);
			return;
		}

		const remaining = rows.filter((row) => !this.matchesWhere(row, where));
		this.tables.set(table, remaining);
	}
}
