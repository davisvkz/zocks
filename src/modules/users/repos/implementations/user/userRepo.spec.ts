import 'reflect-metadata';

import type { Result } from '@/core/Result';
import type { Database } from '@/repo/interfaces/database';
import { MockDatabaseRepo } from '@/repo/implementations/database/mock/mock.service';
import { DatabaseSymbol } from '@/repo/interfaces/database';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { container } from 'tsyringe';

import { User } from '../../../domain/entities/user.entity';
import { UserEmail } from '../../../domain/valueObjects/userEmail/userEmail.valueObject';
import { UserName } from '../../../domain/valueObjects/userName/userName.valueObject';
import { UserPassword } from '../../../domain/valueObjects/userPassword/userPassword.valueObject';
import { UserRepo } from './userRepo';

// @ts-expect-error await needed
const feature = await loadFeature('./userRepo.feature');

describeFeature(feature, ({ Scenario, BeforeEachScenario }) => {
	let repo: UserRepo;
	let existsResult: Result<boolean, string>;
	let getByIdResult: Result<User, string>;
	let getByUsernameResult: Result<User, string>;
	let savedUser: User;

	BeforeEachScenario(() => {
		container.clearInstances();
		container.register<Database>(DatabaseSymbol, MockDatabaseRepo);
		repo = container.resolve(UserRepo);
		existsResult = undefined;
		getByIdResult = undefined;
		getByUsernameResult = undefined;
		savedUser = undefined;
	});

	function makeUser(username: string, email: string, password = '123456'): User {
		const usernameOrError = UserName.create({ name: username });
		const emailOrError = UserEmail.create(email);
		const passwordOrError = UserPassword.create({ value: password });

		if (usernameOrError.isErr()) {
			throw new Error(`Invalid username: ${usernameOrError.unwrapErr()}`);
		}
		if (emailOrError.isErr()) {
			throw new Error(`Invalid email: ${emailOrError.unwrapErr()}`);
		}
		if (passwordOrError.isErr()) {
			throw new Error(`Invalid password: ${passwordOrError.unwrapErr()}`);
		}

		const userOrError = User.create({
			username: usernameOrError.unwrap(),
			email: emailOrError.unwrap(),
			password: passwordOrError.unwrap(),
		});

		if (userOrError.isErr()) {
			throw new Error(`Could not create user: ${userOrError.unwrapErr()}`);
		}

		return userOrError.unwrap();
	}

	Scenario(
		'exists returns false when there is no user with the given email',
		({ Given, When, Then }) => {
			Given('an empty users table', () => {});

			When('I check if a user exists with email "john@example.com"', async () => {
				const emailOrError = UserEmail.create('john@example.com');
				expect(emailOrError.isOk()).toBeTruthy();

				existsResult = await repo.exists(emailOrError.unwrap());
			});

			Then('the exists result should be false', () => {
				expect(existsResult.isOk()).toBeTruthy();
				expect(existsResult.unwrap()).toBe(false);
			});
		},
	);

	Scenario(
		'exists returns true when a user with the given email exists',
		({ Given, And, When, Then }) => {
			Given('an empty users table', () => {});

			And(
				'I save a user with username "john_doe" and email "john@example.com"',
				async () => {
					savedUser = makeUser('john_doe', 'john@example.com');
					const saveResult = await repo.save(savedUser);

					expect(saveResult.isOk()).toBeTruthy();
				},
			);

			When('I check if a user exists with email "john@example.com"', async () => {
				const emailOrError = UserEmail.create('john@example.com');
				expect(emailOrError.isOk()).toBeTruthy();

				existsResult = await repo.exists(emailOrError.unwrap());
			});

			Then('the exists result should be true', () => {
				expect(existsResult.isOk()).toBeTruthy();
				expect(existsResult.unwrap()).toBe(true);
			});
		},
	);

	Scenario(
		'getUserByUserId returns failure when user does not exist',
		({ Given, When, Then }) => {
			Given('an empty users table', () => {});

			When('I get a user by id "non-existent-id"', async () => {
				getByIdResult = await repo.getUserByUserId('non-existent-id');
			});

			Then(
				'the getUserByUserId result should be a failure with message "User Not Founded"',
				() => {
					expect(getByIdResult.isErr()).toBeTruthy();
					expect(getByIdResult.unwrapErr()).toBe('User Not Founded');
				},
			);
		},
	);

	Scenario(
		'getUserByUserId returns the persisted user',
		({ Given, And, When, Then }) => {
			let userId: string;

			Given('an empty users table', () => {});

			And(
				'I save a user with username "john_doe" and email "john@example.com"',
				async () => {
					savedUser = makeUser('john_doe', 'john@example.com');
					const saveResult = await repo.save(savedUser);

					expect(saveResult.isOk()).toBeTruthy();

					userId = savedUser.userId.getStringValue();
				},
			);

			When('I get that user by its id', async () => {
				getByIdResult = await repo.getUserByUserId(userId);
			});

			Then('the getUserByUserId result should be successful', () => {
				expect(getByIdResult.isOk()).toBeTruthy();
			});

			And('the returned user username should be "john_doe"', () => {
				const user = getByIdResult.unwrap();
				expect(user.username.value).toBe('john_doe');
			});

			And('the returned user email should be "john@example.com"', () => {
				const user = getByIdResult.unwrap();
				expect(user.email.value).toBe('john@example.com');
			});
		},
	);

	Scenario(
		'getUserByUserName returns failure when user does not exist',
		({ Given, When, Then }) => {
			Given('an empty users table', () => {});

			When('I get a user by username "unknown_user"', async () => {
				getByUsernameResult = await repo.getUserByUserName('unknown_user');
			});

			Then(
				'the getUserByUserName result should be a failure with message "no user found"',
				() => {
					expect(getByUsernameResult.isErr()).toBeTruthy();
					expect(getByUsernameResult.unwrapErr()).toBe('no user found');
				},
			);
		},
	);

	Scenario(
		'getUserByUserName returns the persisted user',
		({ Given, And, When, Then }) => {
			Given('an empty users table', () => {});

			And(
				'I save a user with username "john_doe" and email "john@example.com"',
				async () => {
					savedUser = makeUser('john_doe', 'john@example.com');
					const saveResult = await repo.save(savedUser);

					expect(saveResult.isOk()).toBeTruthy();
				},
			);

			When('I get a user by username "john_doe"', async () => {
				getByUsernameResult = await repo.getUserByUserName('john_doe');
			});

			Then('the getUserByUserName result should be successful', () => {
				expect(getByUsernameResult.isOk()).toBeTruthy();
			});

			And('the returned user username should be "john_doe"', () => {
				const user = getByUsernameResult.unwrap();
				expect(user.username.value).toBe('john_doe');
			});

			And('the returned user email should be "john@example.com"', () => {
				const user = getByUsernameResult.unwrap();
				expect(user.email.value).toBe('john@example.com');
			});
		},
	);
});
