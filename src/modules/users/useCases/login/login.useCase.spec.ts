import 'reflect-metadata';

import { MockCacheRepo } from '@/repo/implementations/cache/mock/mock.service';
import { MockDatabaseRepo } from '@/repo/implementations/database/mock/mock.service';
import { CacheSymbol } from '@/repo/interfaces/cache';
import { DatabaseSymbol } from '@/repo/interfaces/database';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { container } from 'tsyringe';

import type { IAuthRepo } from '../../repos/interfaces/auth/IAuthRepo';
import type { IUserRepo } from '../../repos/interfaces/user/IUserRepo';
import type { LoginDTO } from './login.dto';
import type { LoginResponse } from './login.response';
import { User } from '../../domain/entities/user.entity';
import { UserEmail } from '../../domain/valueObjects/userEmail/userEmail.valueObject';
import { UserName } from '../../domain/valueObjects/userName/userName.valueObject';
import { UserPassword } from '../../domain/valueObjects/userPassword/userPassword.valueObject';
import { UserRepo } from '../../repos/implementations/user/userRepo';
import { AuthRepoSymbol } from '../../repos/interfaces/auth/IAuthRepo';
import { UserRepoSymbol } from '../../repos/interfaces/user/IUserRepo';
import { LoginErrors } from './login.errors';
import { LoginUseCase } from './login.useCase';

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
const feature = await loadFeature('./login.useCase.feature');

describeFeature(feature, ({ Scenario, BeforeEachScenario }) => {
	let repo: IUserRepo;
	let useCase: LoginUseCase;
	let tokenStore: IAuthRepo;

	BeforeEachScenario(async () => {
		container.clearInstances();

		const { ConfigEnvSymbol, envConfig } = await import('@/config/env');
		const authServiceModule =
			await import('../../services/implementations/auth/auth.service');
		const authServiceInterfaceModule =
			await import('../../services/interfaces/auth/auth.service');
		const authRepoModule =
			(await import('../../repos/implementations/auth/authRepo')) as {
				AuthRepo: new (...args: unknown[]) => IAuthRepo;
			};

		container.registerSingleton(DatabaseSymbol, MockDatabaseRepo);
		container.registerSingleton(CacheSymbol, MockCacheRepo);
		container.registerSingleton<IUserRepo>(UserRepoSymbol, UserRepo);
		container.registerInstance(ConfigEnvSymbol, envConfig);
		container.registerSingleton(AuthRepoSymbol, authRepoModule.AuthRepo);
		container.registerSingleton(
			authServiceInterfaceModule.AuthServiceSymbol,
			authServiceModule.AuthService,
		);

		tokenStore = container.resolve<IAuthRepo>(AuthRepoSymbol);
		repo = container.resolve(UserRepoSymbol);
		useCase = container.resolve(LoginUseCase);
	});

	async function seedUser(email: string, password: string, username = 'john') {
		const userEmail = UserEmail.create(email).unwrap();
		const userPassword = UserPassword.create({ value: password }).unwrap();
		const userName = UserName.create({ name: username }).unwrap();

		const user = User.create({
			email: userEmail,
			password: userPassword,
			username: userName,
		}).unwrap();

		await repo.save(user);
	}

	Scenario(
		'Successfully logs in with valid credentials',
		({ Given, When, Then, And }) => {
			let payload: LoginDTO;
			let result: LoginResponse;

			Given(
				'there is a user with email "john@example.com" and password "123456"',
				async () => {
					await seedUser('john@example.com', '123456');
					payload = { email: 'john@example.com', password: '123456' };
				},
			);

			When(
				'I execute the login use case with email "john@example.com" and password "123456"',
				async () => {
					result = await useCase.execute(payload);
				},
			);

			Then('the login should succeed', () => {
				expect(result.isOk()).toBeTruthy();
			});

			And('the tokens should be cached', async () => {
				if (!result.isOk()) {
					throw new Error('Expected success');
				}

				const tokens = result.unwrap();
				const accessCached = await tokenStore.isAccessTokenValid(
					tokens.accessToken,
				);
				const refreshCached = await tokenStore.isRefreshTokenValid(
					tokens.refreshToken,
				);

				expect(accessCached).toBeTruthy();
				expect(refreshCached).toBeTruthy();
			});
		},
	);

	Scenario('Fails with wrong password', ({ Given, When, Then }) => {
		let payload: LoginDTO;
		let result: LoginResponse;

		Given(
			'there is a user with email "john@example.com" and password "123456"',
			async () => {
				await seedUser('john@example.com', '123456');
				payload = { email: 'john@example.com', password: 'wrongpass' };
			},
		);

		When(
			'I execute the login use case with email "john@example.com" and password "wrongpass"',
			async () => {
				result = await useCase.execute(payload);
			},
		);

		Then('the login should fail due to invalid credentials', () => {
			expect(result.isErr()).toBeTruthy();

			if (!result.isErr()) {
				throw new Error('Expected error result');
			}

			const error = result.unwrapErr() as unknown;
			expect(error).toBeInstanceOf(LoginErrors.InvalidCredentialsError);
		});
	});

	Scenario('Fails with non existent user', ({ Given, When, Then }) => {
		let payload: LoginDTO;
		let result: LoginResponse;

		Given('there is no user with email "ghost@example.com"', () => {
			payload = { email: 'ghost@example.com', password: 'anypass' };
		});

		When(
			'I execute the login use case with email "ghost@example.com" and password "anypass"',
			async () => {
				result = await useCase.execute(payload);
			},
		);

		Then('the login should fail due to invalid credentials', () => {
			expect(result.isErr()).toBeTruthy();

			if (!result.isErr()) {
				throw new Error('Expected error result');
			}

			const error = result.unwrapErr() as unknown;
			expect(error).toBeInstanceOf(LoginErrors.InvalidCredentialsError);
		});
	});
});
