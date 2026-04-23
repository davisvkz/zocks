import type { Result } from '@/core/Result';
import { UniqueEntityID } from '@/domain/UniqueEntityID';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';

import { UserCreated } from '../events/userCreated.event';
import { UserDeleted } from '../events/userDeleted.event';
import { UserEmail } from '../valueObjects/userEmail/userEmail.valueObject';
import { UserName } from '../valueObjects/userName/userName.valueObject';
import { UserPassword } from '../valueObjects/userPassword/userPassword.valueObject';
import { User } from './user.entity';

// @ts-expect-error await needed
const feature = await loadFeature('./user.entity.feature');

describeFeature(feature, ({ Scenario }) => {
	Scenario('Successfully creates a new user', ({ Given, When, Then, And }) => {
		let username: string;
		let email: string;
		let password: string;
		let result: Result<User, string>;

		Given(
			'I have a valid username "john_doe", email "john@example.com" and password "123456"',
			() => {
				username = 'john_doe';
				email = 'john@example.com';
				password = '123456';
			},
		);

		When('I create a new user entity', () => {
			const usernameVO = UserName.create({ name: username }).unwrap();
			const emailVO = UserEmail.create(email).unwrap();
			const passwordVO = UserPassword.create({
				value: password,
				hashed: false,
			}).unwrap();

			result = User.create({
				username: usernameVO,
				email: emailVO,
				password: passwordVO,
			});
		});

		Then('the user creation result should be successful', () => {
			expect(result.isOk()).toBeTruthy();
			expect(result.isErr()).toBeFalsy();
		});

		And('the user should have default flags set', () => {
			const user = result.unwrap();

			expect(user.isDeleted).toBeFalsy();
			expect(user.isEmailVerified).toBeFalsy();
			expect(user.isAdminUser).toBeFalsy();
		});

		And('the user should have a UserCreated domain event', () => {
			const user = result.unwrap();
			const createdEvents = user.domainEvents.filter(
				(event) => event instanceof UserCreated,
			);

			expect(createdEvents.length).toBe(1);
			const userCreatedEvent = createdEvents[0];
			expect(userCreatedEvent.user).toBe(user);
		});
	});

	Scenario('Fails when username is missing', ({ Given, When, Then, And }) => {
		let email: string;
		let password: string;
		let result: Result<User, string>;

		Given(
			'I have an email "john@example.com" and password "123456" but no username',
			() => {
				email = 'john@example.com';
				password = '123456';
			},
		);

		When('I try to create a new user entity', () => {
			const emailVO = UserEmail.create(email).unwrap();
			const passwordVO = UserPassword.create({
				value: password,
				hashed: false,
			}).unwrap();

			result = User.create({
				username: undefined,
				email: emailVO,
				password: passwordVO,
			});
		});

		Then('the user creation result should be a failure', () => {
			expect(result.isErr()).toBeTruthy();
			expect(result.isOk()).toBeFalsy();
		});

		And(
			'the user creation error message should be "username is null or undefined"',
			() => {
				expect(result.unwrapErr()).toEqual('username is null or undefined');
			},
		);
	});

	Scenario('Fails when email is missing', ({ Given, When, Then, And }) => {
		let username: string;
		let password: string;
		let result: Result<User, string>;

		Given(
			'I have a username "john_doe" and password "123456" but no email',
			() => {
				username = 'john_doe';
				password = '123456';
			},
		);

		When('I try to create a new user entity', () => {
			const usernameVO = UserName.create({ name: username }).unwrap();
			const passwordVO = UserPassword.create({
				value: password,
				hashed: false,
			}).unwrap();

			result = User.create({
				username: usernameVO,
				email: undefined,
				password: passwordVO,
			});
		});

		Then('the user creation result should be a failure', () => {
			expect(result.isErr()).toBeTruthy();
			expect(result.isOk()).toBeFalsy();
		});

		And(
			'the user creation error message should be "email is null or undefined"',
			() => {
				expect(result.unwrapErr()).toEqual('email is null or undefined');
			},
		);
	});

	Scenario(
		'Creates an existing user without raising a UserCreated event',
		({ Given, And, When, Then }) => {
			let id: UniqueEntityID;
			let username: string;
			let email: string;
			let password: string;
			let result: Result<User, string>;

			Given('I have a persisted user id', () => {
				id = new UniqueEntityID('existing-user-id');
			});

			And(
				'a valid username "persisted_user", email "persisted@example.com" and password "123456"',
				() => {
					username = 'persisted_user';
					email = 'persisted@example.com';
					password = '123456';
				},
			);

			When('I create a user entity with the existing id', () => {
				const usernameVO = UserName.create({ name: username }).unwrap();
				const emailVO = UserEmail.create(email).unwrap();
				const passwordVO = UserPassword.create({
					value: password,
					hashed: false,
				}).unwrap();

				result = User.create(
					{
						username: usernameVO,
						email: emailVO,
						password: passwordVO,
						isEmailVerified: true,
						isAdminUser: true,
						isDeleted: false,
					},
					id,
				);
			});

			Then('the user creation result should be successful', () => {
				expect(result.isOk()).toBeTruthy();
			});

			And('the user should not have a UserCreated domain event', () => {
				const user = result.unwrap();
				const createdEvents = user.domainEvents.filter(
					(event) => event instanceof UserCreated,
				);

				expect(createdEvents.length).toBe(0);
			});
		},
	);

	Scenario(
		'Deletes a user and raises UserDeleted event',
		({ Given, And, When, Then }) => {
			let username: string;
			let email: string;
			let password: string;
			let result: Result<User, string>;

			Given(
				'I have a valid username "to_delete", email "delete@example.com" and password "123456"',
				() => {
					username = 'to_delete';
					email = 'delete@example.com';
					password = '123456';
				},
			);

			And('I create a new user entity', () => {
				const usernameVO = UserName.create({ name: username }).unwrap();
				const emailVO = UserEmail.create(email).unwrap();
				const passwordVO = UserPassword.create({
					value: password,
					hashed: false,
				}).unwrap();

				result = User.create({
					username: usernameVO,
					email: emailVO,
					password: passwordVO,
				});

				expect(result.isOk()).toBeTruthy();
			});

			When('I delete the user', () => {
				const user = result.unwrap();
				user.delete();
			});

			Then('the user should be marked as deleted', () => {
				const user = result.unwrap();
				expect(user.isDeleted).toBeTruthy();
			});

			And('the user should have a UserDeleted domain event', () => {
				const user = result.unwrap();
				const deletedEvents = user.domainEvents.filter(
					(event) => event instanceof UserDeleted,
				);

				expect(deletedEvents.length).toBe(1);
				const userDeletedEvent = deletedEvents[0];
				expect(userDeletedEvent.user).toBe(user);
			});
		},
	);

	Scenario(
		'Deleting an already deleted user should be idempotent',
		({ Given, And, When, Then }) => {
			let username: string;
			let email: string;
			let password: string;
			let result: Result<User, string>;

			Given(
				'I have a valid username "already_deleted", email "deleted@example.com" and password "123456"',
				() => {
					username = 'already_deleted';
					email = 'deleted@example.com';
					password = '123456';
				},
			);

			And('I create a new user entity', () => {
				const usernameVO = UserName.create({ name: username }).unwrap();
				const emailVO = UserEmail.create(email).unwrap();
				const passwordVO = UserPassword.create({
					value: password,
					hashed: false,
				}).unwrap();

				result = User.create({
					username: usernameVO,
					email: emailVO,
					password: passwordVO,
				});

				expect(result.isOk()).toBeTruthy();
			});

			And('I delete the user', () => {
				const user = result.unwrap();
				user.delete();
			});

			When('I delete the user again', () => {
				const user = result.unwrap();
				user.delete();
			});

			Then('the user should still be marked as deleted', () => {
				const user = result.unwrap();
				expect(user.isDeleted).toBeTruthy();
			});

			And('the user should only have one UserDeleted domain event', () => {
				const user = result.unwrap();
				const deletedEvents = user.domainEvents.filter(
					(event) => event instanceof UserDeleted,
				);

				expect(deletedEvents.length).toBe(1);
			});
		},
	);
});
