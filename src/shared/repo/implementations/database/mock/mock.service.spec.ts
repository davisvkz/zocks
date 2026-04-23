import 'reflect-metadata';

import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';

import { MockDatabaseRepo } from './mock.service';

type UserRow = {
	id: string;
	name: string;
};

const USERS_TABLE = 'users';

// @ts-expect-error await needed
const feature = await loadFeature('./mock.service.feature');

describeFeature(feature, ({ Scenario }) => {
	Scenario('Inserts and finds a single row', ({ Given, When, Then, And }) => {
		let database: MockDatabaseRepo;
		let inserted: UserRow;
		let found: UserRow | null;

		Given('I have an empty mock database', () => {
			database = new MockDatabaseRepo();
		});

		When(
			'I insert a user with id "1" and name "John" into the "users" table',
			async () => {
				inserted = { id: '1', name: 'John' };
				await database.insert<UserRow>(USERS_TABLE, inserted);
			},
		);

		Then('I should be able to find a user in the "users" table', async () => {
			found = await database.find<UserRow>(USERS_TABLE);
			expect(found).not.toBeNull();
		});

		And('the found user should have id "1" and name "John"', () => {
			expect(found).toEqual(inserted);
		});
	});

	Scenario('Finds a row by where clause', ({ Given, And, When, Then }) => {
		let database: MockDatabaseRepo;
		let result: UserRow | null;

		Given('I have an empty mock database', () => {
			database = new MockDatabaseRepo();
		});

		And('I have two users in the "users" table', async () => {
			await database.insert<UserRow>(USERS_TABLE, { id: '1', name: 'John' });
			await database.insert<UserRow>(USERS_TABLE, { id: '2', name: 'Jane' });
		});

		When('I search in the "users" table for the user with id "2"', async () => {
			result = await database.find<UserRow>(USERS_TABLE, { id: '2' });
		});

		Then('I should get back only the user with id "2"', () => {
			expect(result).toEqual({ id: '2', name: 'Jane' });
		});
	});

	Scenario('Returns all rows with findAll', ({ Given, And, When, Then }) => {
		let database: MockDatabaseRepo;
		let allUsers: UserRow[];

		Given('I have an empty mock database', () => {
			database = new MockDatabaseRepo();
		});

		And('I have two users in the "users" table', async () => {
			await database.insert<UserRow>(USERS_TABLE, { id: '1', name: 'John' });
			await database.insert<UserRow>(USERS_TABLE, { id: '2', name: 'Jane' });
		});

		When('I list all users in the "users" table', async () => {
			allUsers = await database.findAll<UserRow>(USERS_TABLE);
		});

		Then('I should get 2 rows back', () => {
			expect(allUsers).toHaveLength(2);
		});
	});

	Scenario(
		'Updates a row matched by where clause',
		({ Given, And, When, Then }) => {
			let database: MockDatabaseRepo;
			let updated: UserRow | null;

			Given('I have an empty mock database', () => {
				database = new MockDatabaseRepo();
			});

			And(
				'I have a user with id "1" and name "John" in the "users" table',
				async () => {
					await database.insert<UserRow>(USERS_TABLE, {
						id: '1',
						name: 'John',
					});
				},
			);

			When(
				'I update the user with id "1" in the "users" table changing the name to "Johnny"',
				async () => {
					await database.update<UserRow>(
						USERS_TABLE,
						{ name: 'Johnny' },
						{
							id: '1',
						},
					);
				},
			);

			Then('I should be able to find a user in the "users" table', async () => {
				updated = await database.find<UserRow>(USERS_TABLE, { id: '1' });
				expect(updated).not.toBeNull();
			});

			And('the found user should have id "1" and name "Johnny"', () => {
				expect(updated).toEqual({ id: '1', name: 'Johnny' });
			});
		},
	);

	Scenario(
		'Deletes rows matched by where clause',
		({ Given, And, When, Then }) => {
			let database: MockDatabaseRepo;
			let remaining: UserRow[];

			Given('I have an empty mock database', () => {
				database = new MockDatabaseRepo();
			});

			And('I have two users in the "users" table', async () => {
				await database.insert<UserRow>(USERS_TABLE, {
					id: '1',
					name: 'John',
				});
				await database.insert<UserRow>(USERS_TABLE, {
					id: '2',
					name: 'Jane',
				});
			});

			When('I delete users from the "users" table with the id "1"', async () => {
				await database.delete(USERS_TABLE, { id: '1' });
			});

			Then(
				'I should get 1 row back when I list all users in the "users" table',
				async () => {
					remaining = await database.findAll<UserRow>(USERS_TABLE);
					expect(remaining).toHaveLength(1);
				},
			);

			And('the remaining user should have id "2"', () => {
				expect(remaining[0]).toEqual({ id: '2', name: 'Jane' });
			});
		},
	);
});
