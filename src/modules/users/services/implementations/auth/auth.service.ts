/* eslint-disable @typescript-eslint/consistent-type-imports */
import type { Result } from '@/core/Result';
import { ConfigEnvSymbol, envConfig } from '@/config/env';
import { Err, Ok } from '@/core/Result';
import { sign, verify } from 'jsonwebtoken';
import { container, inject, singleton } from 'tsyringe';

import type { IAuthRepo } from '../../../repos/interfaces/auth/IAuthRepo';
import type {
	AuthTokens,
	IAuthService,
	JWTPayload,
} from '../../interfaces/auth/auth.service';
import { AuthRepoSymbol } from '../../../repos/interfaces/auth/IAuthRepo';
import { AuthServiceSymbol } from '../../interfaces/auth/auth.service';

@singleton()
export class AuthService implements IAuthService {
	constructor(
		@inject(ConfigEnvSymbol) private readonly config: typeof envConfig,
		@inject(AuthRepoSymbol)
		private readonly tokenStore: IAuthRepo,
	) {}

	private durationToSeconds(duration: string): number {
		const map: Record<string, number> = {
			'5m': 5 * 60,
			'1h': 60 * 60,
			'1d': 24 * 60 * 60,
			'1w': 7 * 24 * 60 * 60,
			'7d': 7 * 24 * 60 * 60,
		};

		return map[duration] ?? 60 * 60; // default 1h
	}

	async generateTokens(payload: JWTPayload): Promise<AuthTokens> {
		const accessToken = sign(payload, this.config.jwt.accessTokenSecret, {
			expiresIn: this.config.jwt.expiresIn,
		});

		const refreshToken = sign(payload, this.config.jwt.refreshTokenSecret, {
			expiresIn: this.config.jwt.refreshTokenExpiresIn,
		});

		const accessTtl = this.durationToSeconds(this.config.jwt.expiresIn);
		const refreshTtl = this.durationToSeconds(
			this.config.jwt.refreshTokenExpiresIn,
		);

		await Promise.all([
			this.tokenStore.cacheAccessToken(accessToken, accessTtl),
			this.tokenStore.cacheRefreshToken(refreshToken, refreshTtl),
		]);

		return {
			accessToken,
			refreshToken,
			accessTokenExpiresIn: this.config.jwt.expiresIn,
			refreshTokenExpiresIn: this.config.jwt.refreshTokenExpiresIn,
		};
	}

	async verifyAccessToken(token: string): Promise<Result<JWTPayload, string>> {
		try {
			const decoded = verify(
				token,
				this.config.jwt.accessTokenSecret,
			) as JWTPayload;

			const exists = await this.tokenStore.isAccessTokenValid(token);
			if (!exists) {
				return Err('Token expirado ou inválido');
			}

			return Ok(decoded);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Invalid token';
			return Err(message);
		}
	}

	async verifyRefreshToken(token: string): Promise<Result<JWTPayload, string>> {
		try {
			const decoded = verify(
				token,
				this.config.jwt.refreshTokenSecret,
			) as JWTPayload;

			const exists = await this.tokenStore.isRefreshTokenValid(token);
			if (!exists) {
				return Err('Token expirado ou inválido');
			}

			return Ok(decoded);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Invalid token';
			return Err(message);
		}
	}
}

container.registerSingleton(AuthServiceSymbol, AuthService);
