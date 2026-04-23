import 'reflect-metadata';

import { MockCacheRepo } from '@/repo/implementations/cache/mock/mock.service';
import { CacheSymbol } from '@/repo/interfaces/cache';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { container } from 'tsyringe';

import type { IAuthRepo } from '../../../repos/interfaces/auth/IAuthRepo';
import type {
	AuthTokens,
	IAuthService,
	JWTPayload,
} from '../../interfaces/auth/auth.service';
import { AuthRepoSymbol } from '../../../repos/interfaces/auth/IAuthRepo';

// Ensure required env vars exist before importing auth service/config
Object.assign(process.env, {
	JWT_ACCESS_TOKEN_SECRET: 'access-secret',
	JWT_ACCESS_TOKEN_EXPIRES_IN: '1h',
	JWT_REFRESH_TOKEN_SECRET: 'refresh-secret',
	JWT_REFRESH_TOKEN_EXPIRES_IN: '7d',
	REDIS_URL: 'redis://localhost:6379',
	POSTGRES_URL: 'postgres://localhost:5432/db',
	RESEND_URL: 'https://example.com',
	RESEND_EMAIL_FROM: 'noreply@example.com',
	RESEND_EMAIL_DOMAIN: 'example.com',
	KAFKA_CLIENT_ID: 'client',
	KAFKA_BROKERS: 'broker:9092',
	KAFKA_GROUP_ID: 'group',
});

// @ts-expect-error await needed
const feature = await loadFeature('./auth.service.feature');

describeFeature(feature, ({ Scenario, BeforeEachScenario }) => {
	let authService: IAuthService;
	let tokenStore: IAuthRepo;

	BeforeEachScenario(async () => {
		container.clearInstances();

		const { ConfigEnvSymbol, envConfig } = await import('@/config/env');
		const authServiceModule = await import('./auth.service');
		const authServiceInterfaceModule =
			await import('../../interfaces/auth/auth.service');
		const authRepoModule =
			(await import('../../../repos/implementations/auth/authRepo')) as {
				AuthRepo: new (...args: unknown[]) => IAuthRepo;
			};

		container.registerSingleton(CacheSymbol, MockCacheRepo);
		container.registerInstance(ConfigEnvSymbol, envConfig);
		container.registerSingleton(AuthRepoSymbol, authRepoModule.AuthRepo);
		container.registerSingleton(
			authServiceInterfaceModule.AuthServiceSymbol,
			authServiceModule.AuthService,
		);

		tokenStore = container.resolve<IAuthRepo>(AuthRepoSymbol);
		authService = container.resolve<IAuthService>(
			authServiceInterfaceModule.AuthServiceSymbol,
		);
	});

	Scenario('Generates and validates tokens', ({ Given, When, Then, And }) => {
		let payload: JWTPayload;
		let tokens: AuthTokens;

		Given('I have a JWT payload with id "user-1"', () => {
			payload = {
				sub: 'user-1',
				email: 'user1@example.com',
				username: 'user1',
				isAdminUser: false,
			};
		});

		When('I generate tokens with the auth service', async () => {
			tokens = await authService.generateTokens(payload);
		});

		Then('both tokens should be valid', async () => {
			const accessResult = await authService.verifyAccessToken(tokens.accessToken);
			const refreshResult = await authService.verifyRefreshToken(
				tokens.refreshToken,
			);

			expect(accessResult.isOk()).toBeTruthy();
			expect(refreshResult.isOk()).toBeTruthy();
		});

		And('both tokens should be stored in cache', async () => {
			const accessCached = await tokenStore.isAccessTokenValid(tokens.accessToken);
			const refreshCached = await tokenStore.isRefreshTokenValid(
				tokens.refreshToken,
			);

			expect(accessCached).toBeTruthy();
			expect(refreshCached).toBeTruthy();
		});
	});

	Scenario('Rejects tokens removed from cache', ({ Given, And, When, Then }) => {
		let tokens: AuthTokens;
		let accessVerificationResult: Awaited<
			ReturnType<IAuthService['verifyAccessToken']>
		>;

		Given('I have generated tokens for user "user-2"', async () => {
			const payload: JWTPayload = {
				sub: 'user-2',
				email: 'user2@example.com',
				username: 'user2',
				isAdminUser: false,
			};

			tokens = await authService.generateTokens(payload);
		});

		And('I remove the access token from cache', async () => {
			await tokenStore.invalidateAccessToken(tokens.accessToken);
		});

		When('I try to verify the access token', async () => {
			accessVerificationResult = await authService.verifyAccessToken(
				tokens.accessToken,
			);
		});

		Then('the verification should fail', async () => {
			expect(accessVerificationResult.isErr()).toBeTruthy();
		});
	});
});
