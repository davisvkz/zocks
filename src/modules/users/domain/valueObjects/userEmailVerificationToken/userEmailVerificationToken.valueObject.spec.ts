import 'reflect-metadata';

import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';

import { EmailVerificationToken } from './userEmailVerificationToken.valueObject';

// @ts-expect-error await needed
const feature = await loadFeature(
	'./userEmailVerificationToken.valueObject.feature',
);

describeFeature(feature, ({ Scenario, BeforeEachScenario }) => {
	let result: ReturnType<typeof EmailVerificationToken.create>;
	let token: EmailVerificationToken;
	let recreatedResult: ReturnType<typeof EmailVerificationToken.create>;
	let recreatedToken: EmailVerificationToken;
	let rawJson: string;

	BeforeEachScenario(() => {});

	Scenario('Create a new email verification token', ({ When, Then, And }) => {
		When('I create a new EmailVerificationToken', () => {
			result = EmailVerificationToken.create();
			token = result.unwrap();
		});

		Then('the EmailVerificationToken result should be successful', () => {
			expect(result.isOk()).toBeTruthy();
		});

		And('the generated token should have 4 characters', () => {
			expect(token.value.token).toHaveLength(4);
		});

		And('the generated token should be uppercased', () => {
			expect(token.value.token).toBe(token.value.token.toUpperCase());
		});

		And('the generated token expiry should be in the future', () => {
			const now = new Date();
			expect(token.value.expiry.getTime()).toBeGreaterThan(now.getTime());
		});
	});

	Scenario(
		'Recreate a token from its raw JSON value',
		({ Given, When, Then, And }) => {
			Given('I already have a generated EmailVerificationToken', () => {
				const initialResult = EmailVerificationToken.create();
				expect(initialResult.isOk()).toBeTruthy();

				token = initialResult.unwrap();
			});

			When('I serialize it to JSON and recreate the token from that JSON', () => {
				rawJson = token.toJSON();

				recreatedResult = EmailVerificationToken.create(rawJson);
				recreatedToken = recreatedResult.unwrap();
			});

			Then(
				'the recreated EmailVerificationToken result should be successful',
				() => {
					expect(recreatedResult.isOk()).toBeTruthy();
				},
			);

			And('the recreated token should have the same token value', () => {
				expect(recreatedToken.value.token).toBe(token.value.token);
			});

			And('the recreated token expiry should be a Date instance', () => {
				expect(recreatedToken.value.expiry).toBeInstanceOf(Date);
			});
		},
	);
});
