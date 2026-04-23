import { Cache, CacheSymbol } from '@/repo/interfaces/cache';
import { container, inject, singleton } from 'tsyringe';

import type { IAuthRepo } from '../../interfaces/auth/IAuthRepo';
import { AuthRepoSymbol } from '../../interfaces/auth/IAuthRepo';

@singleton()
export class AuthRepo implements IAuthRepo {
	constructor(@inject(CacheSymbol) private readonly cache: Cache) {}

	private accessCacheKey(token: string): string {
		return `auth:access:${token}`;
	}

	private refreshCacheKey(token: string): string {
		return `auth:refresh:${token}`;
	}

	async cacheAccessToken(token: string, ttlSeconds: number): Promise<void> {
		await this.cache.set(this.accessCacheKey(token), '1', ttlSeconds);
	}

	async cacheRefreshToken(token: string, ttlSeconds: number): Promise<void> {
		await this.cache.set(this.refreshCacheKey(token), '1', ttlSeconds);
	}

	async isAccessTokenValid(token: string): Promise<boolean> {
		return this.cache.exists(this.accessCacheKey(token));
	}

	async isRefreshTokenValid(token: string): Promise<boolean> {
		return this.cache.exists(this.refreshCacheKey(token));
	}

	async invalidateAccessToken(token: string): Promise<void> {
		await this.cache.delete(this.accessCacheKey(token));
	}

	async invalidateRefreshToken(token: string): Promise<void> {
		await this.cache.delete(this.refreshCacheKey(token));
	}
}

container.registerSingleton(AuthRepoSymbol, AuthRepo);
