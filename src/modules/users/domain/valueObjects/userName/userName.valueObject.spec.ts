import 'reflect-metadata';

import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';

import { UserName } from './userName.valueObject';

// @ts-expect-error await needed
const feature = await loadFeature('./userName.valueObject.feature');

describeFeature(feature, ({ Scenario, BeforeEachScenario }) => {
	let currentName: string | null;
	let result: ReturnType<typeof UserName.create>;

	BeforeEachScenario(() => {
		currentName = null;
	});

	Scenario(
		'Successfully create a valid username',
		({ Given, When, Then, And }) => {
			Given('I provide the username "john_doe"', () => {
				currentName = 'john_doe';
			});

			When('I create a UserName', () => {
				result = UserName.create({ name: currentName });
			});

			Then('the UserName result should be successful', () => {
				expect(result.isOk()).toBeTruthy();
			});

			And('the stored username value should be "john_doe"', () => {
				const username = result.unwrap();
				expect(username.value).toBe('john_doe');
			});
		},
	);

	Scenario('Fail when username is null', ({ Given, When, Then, And }) => {
		Given('I provide a null username', () => {
			currentName = null;
		});

		When('I create a UserName', () => {
			result = UserName.create({ name: currentName });
		});

		Then('the UserName result should be a failure', () => {
			expect(result.isErr()).toBeTruthy();
		});

		And('the error message should be "username is null or undefined"', () => {
			expect(result.unwrapErr()).toBe('username is null or undefined');
		});
	});

	Scenario('Fail when username is too short', ({ Given, When, Then, And }) => {
		Given('I provide the username "a"', () => {
			currentName = 'a';
		});

		When('I create a UserName', () => {
			result = UserName.create({ name: currentName });
		});

		Then('the UserName result should be a failure', () => {
			expect(result.isErr()).toBeTruthy();
		});

		And('the error message should be "Text is not at least 2 chars."', () => {
			expect(result.unwrapErr()).toBe('Text is not at least 2 chars.');
		});
	});

	Scenario('Fail when username is too long', ({ Given, When, Then, And }) => {
		Given('I provide a username longer than 15 characters', () => {
			currentName = 'this_is_a_very_long_username';
		});

		When('I create a UserName', () => {
			result = UserName.create({ name: 'this_is_a_very_long_username' as string });
		});

		Then('the UserName result should be a failure', () => {
			expect(result.isErr()).toBeTruthy();
		});

		And('the error message should be "Text is greater than 15 chars."', () => {
			expect(result.unwrapErr()).toBe('Text is greater than 15 chars.');
		});
	});
});
