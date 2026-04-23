import 'reflect-metadata';

import type { Database } from '@/repo/interfaces/database';
import { MockDatabaseRepo } from '@/repo/implementations/database/mock/mock.service';
import { DatabaseSymbol } from '@/repo/interfaces/database';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { container } from 'tsyringe';

import type { UserPersistence } from '../../mappers/user.mapper';
import type { IUserRepo } from '../../repos/interfaces/user/IUserRepo';
import type { CreateUserDTO } from './createUser.dto';
import type { CreateUserResponse } from './createUser.response';
import { UserRepo } from '../../repos/implementations/user/userRepo';
import { UserRepoSymbol } from '../../repos/interfaces/user/IUserRepo';
import { CreateUserErrors } from './createUser.errors';
import { CreateUserUseCase } from './createUser.useCase';

// @ts-expect-error await needed
const feature = await loadFeature('./createUser.useCase.feature');

describeFeature(feature, ({ Scenario, BeforeEachScenario }) => {
	let database: MockDatabaseRepo;
	let useCase: CreateUserUseCase;

	BeforeEachScenario(() => {
		container.clearInstances();
		container.registerSingleton<Database>(DatabaseSymbol, MockDatabaseRepo);
		container.registerSingleton<IUserRepo>(UserRepoSymbol, UserRepo);

		database = container.resolve(DatabaseSymbol);
		useCase = container.resolve(CreateUserUseCase);
	});

	Scenario('Successfully creates a new user', ({ Given, When, Then, And }) => {
		let payload: CreateUserDTO;
		let result: CreateUserResponse;

		Given(
			'I have a valid user payload with username "john_doe", email "john@example.com" and password "123456"',
			() => {
				payload = {
					username: 'john_doe',
					email: 'john@example.com',
					password: '123456',
				};
			},
		);

		When('I execute the create user use case', async () => {
			result = await useCase.execute(payload);
		});

		Then('the result should be successful', () => {
			expect(result.isOk()).toBeTruthy();
		});

		And('the user should be persisted in the database', async () => {
			const users = await database.findAll<UserPersistence>('users');

			expect(users).toHaveLength(1);
			expect(users[0].username).toBe(payload.username);
			expect(users[0].user_email).toBe(payload.email);
		});
	});

	Scenario('Fails when email already exists', ({ Given, And, When, Then }) => {
		let payload: CreateUserDTO;
		let result: CreateUserResponse;

		Given(
			'I have a valid user payload with username "john_doe", email "john@example.com" and password "123456"',
			() => {
				payload = {
					username: 'john_doe',
					email: 'john@example.com',
					password: '123456',
				};
			},
		);

		And(
			'there is already a user with email "john@example.com" in the system',
			async () => {
				await useCase.execute(payload);
			},
		);

		When('I execute the create user use case again', async () => {
			result = await useCase.execute(payload);
		});

		Then(
			'the result should be a failure because the email already exists',
			() => {
				expect(result.isErr()).toBeTruthy();

				if (!result.isErr()) {
					throw new Error('Expected error result');
				}

				const error = result.unwrapErr() as unknown;

				if (!(error instanceof CreateUserErrors.EmailAlreadyExistsError)) {
					throw new Error('Expected EmailAlreadyExistsError');
				}

				expect(error.message).toContain('already exists');
			},
		);
	});

	Scenario('Fails when username is already taken', ({ Given, When, Then }) => {
		let firstPayload: CreateUserDTO;
		let secondPayload: CreateUserDTO;
		let result: CreateUserResponse;

		Given(
			'I have two users with the same username but different emails',
			async () => {
				firstPayload = {
					username: 'john_doe',
					email: 'john@example.com',
					password: '123456',
				};

				secondPayload = {
					username: 'john_doe',
					email: 'jane@example.com',
					password: 'abcdef',
				};

				await useCase.execute(firstPayload);
			},
		);

		When('I try to create the second user', async () => {
			result = await useCase.execute(secondPayload);
		});

		Then('the result should be a failure because the username is taken', () => {
			expect(result.isErr()).toBeTruthy();

			if (!result.isErr()) {
				throw new Error('Expected error result');
			}

			const error = result.unwrapErr() as unknown;

			if (!(error instanceof CreateUserErrors.UsernameTakenError)) {
				throw new Error('Expected UsernameTakenError');
			}

			expect(error.message).toContain('already taken');
		});
	});
});
