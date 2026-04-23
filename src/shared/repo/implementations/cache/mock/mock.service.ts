import type { Cache } from '@/repo/interfaces/cache';
import { injectable } from 'tsyringe';

type CacheEntry = {
	value: string;
	expiresAt?: number;
};

@injectable()
export class MockCacheRepo implements Cache {
	private store = new Map<string, CacheEntry>();

	private isExpired(entry: CacheEntry | undefined): boolean {
		if (!entry) return true;
		if (!entry.expiresAt) return false;

		const now = Date.now();
		return now > entry.expiresAt;
	}

	async exists(key: string): Promise<boolean> {
		const entry = this.store.get(key);

		if (!entry || this.isExpired(entry)) {
			this.store.delete(key);
			return false;
		}

		return true;
	}

	async get(key: string): Promise<string | null> {
		const entry = this.store.get(key);

		if (!entry || this.isExpired(entry)) {
			this.store.delete(key);
			return null;
		}

		return entry.value;
	}

	async set(key: string, value: string, ttl?: number): Promise<void> {
		const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined;

		this.store.set(key, {
			value,
			expiresAt,
		});
	}

	async delete(key: string): Promise<void> {
		this.store.delete(key);
	}
}
