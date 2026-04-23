import type { InjectionToken } from 'tsyringe';

export interface IAuthRepo {
	cacheAccessToken(token: string, ttlSeconds: number): Promise<void>;
	cacheRefreshToken(token: string, ttlSeconds: number): Promise<void>;
	isAccessTokenValid(token: string): Promise<boolean>;
	isRefreshTokenValid(token: string): Promise<boolean>;
	invalidateAccessToken(token: string): Promise<void>;
	invalidateRefreshToken(token: string): Promise<void>;
}

export const AuthRepoSymbol: InjectionToken<IAuthRepo> = Symbol.for('AuthRepo');
