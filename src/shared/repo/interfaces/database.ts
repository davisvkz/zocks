export type Where = Record<string, unknown>;

export interface Database {
	insert<T>(table: string, data: T): Promise<T>;
	find<T>(table: string, where?: Where): Promise<T | null>;
	findAll<T>(table: string, where?: Where): Promise<T[]>;
	update<T>(table: string, data: Partial<T>, where?: Where): Promise<T>;
	delete(table: string, where?: Where): Promise<void>;
}

export const DatabaseSymbol = Symbol.for('Database');
