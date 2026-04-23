import 'reflect-metadata';

import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';

import { UserEmail } from './userEmail.valueObject';

// @ts-expect-error await needed
const feature = await loadFeature('./userEmail.valueObject.feature');

describeFeature(feature, ({ Scenario, BeforeEachScenario }) => {
	let rawEmail: string;
	let result: ReturnType<typeof UserEmail.create>;

	BeforeEachScenario(() => {
		rawEmail = '';
	});

	Scenario('Successfully create a user email', ({ Given, When, Then, And }) => {
		Given('I have the raw email "JOHN@example.COM "', () => {
			rawEmail = 'JOHN@example.COM';
		});

		When('I create a UserEmail', () => {
			result = UserEmail.create(rawEmail);
		});

		Then('the UserEmail result should be successful', () => {
			expect(result.isOk()).toBeTruthy();
		});

		And('the stored email value should be "john@example.com"', () => {
			const email = result.unwrap();
			expect(email.value).toBe('john@example.com');
		});
	});

	Scenario(
		'Fail to create a user email with an invalid format',
		({ Given, When, Then, And }) => {
			Given('I have the raw email "invalid-email"', () => {
				rawEmail = 'invalid-email';
			});

			When('I create a UserEmail', () => {
				result = UserEmail.create(rawEmail);
			});

			Then('the UserEmail result should be a failure', () => {
				expect(result.isErr()).toBeTruthy();
			});

			And('the error message should be "Email address not valid"', () => {
				expect(result.unwrapErr()).toBe('Email address not valid');
			});
		},
	);
});
