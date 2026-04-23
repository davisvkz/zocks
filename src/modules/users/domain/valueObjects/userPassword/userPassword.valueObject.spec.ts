import 'reflect-metadata';

import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';

import { UserPassword } from './userPassword.valueObject';

// @ts-expect-error await needed
const feature = await loadFeature('./userPassword.valueObject.feature');

describeFeature(feature, ({ Scenario, BeforeEachScenario }) => {
	let rawPassword: string;
	let isHashedFlag: boolean | undefined;
	let result: ReturnType<typeof UserPassword.create>;
	let createdPassword: UserPassword;
	let hashedValue: string;
	let compareCorrect: boolean;
	let compareWrong: boolean;

	BeforeEachScenario(() => {
		rawPassword = '';
		isHashedFlag = undefined;
	});

	Scenario(
		'Successfully create a valid password',
		({ Given, When, Then, And }) => {
			Given('I provide the password "supersecret"', () => {
				rawPassword = 'supersecret';
			});

			When('I create a UserPassword without the hashed flag', () => {
				result = UserPassword.create({ value: rawPassword });
				createdPassword = result.unwrap();
			});

			Then('the UserPassword result should be successful', () => {
				expect(result.isOk()).toBeTruthy();
			});

			And('the stored password value should be "supersecret"', () => {
				expect(createdPassword.value).toBe('supersecret');
			});
		},
	);

	Scenario('Fail when password is too short', ({ Given, When, Then, And }) => {
		Given('I provide the password "123"', () => {
			rawPassword = '123';
		});

		When('I create a UserPassword without the hashed flag', () => {
			result = UserPassword.create({ value: rawPassword });
		});

		Then('the UserPassword result should be a failure', () => {
			expect(result.isErr()).toBeTruthy();
		});

		And(
			'the error message should be "Password doesnt meet criteria [8 chars min]."',
			() => {
				expect(result.unwrapErr()).toBe(
					'Password doesnt meet criteria [8 chars min].',
				);
			},
		);
	});

	Scenario(
		'Allow already hashed passwords without enforcing length',
		({ Given, When, Then }) => {
			Given(
				'I provide a hashed password value shorter than the minimum length',
				() => {
					rawPassword = 'abcd';
					isHashedFlag = true;
				},
			);

			When('I create a UserPassword with the hashed flag', () => {
				result = UserPassword.create({
					value: rawPassword,
					hashed: isHashedFlag,
				});
			});

			Then('the UserPassword result should be successful', () => {
				expect(result.isOk()).toBeTruthy();
			});
		},
	);

	Scenario(
		'Compare hashed passwords correctly',
		({ Given, When, Then, And }) => {
			Given('I provide the password "supersecret"', () => {
				rawPassword = 'supersecret';
			});

			When('I hash the password using UserPassword', () => {
				const plainResult = UserPassword.create({
					value: rawPassword,
				});
				expect(plainResult.isOk()).toBeTruthy();

				const plainPassword = plainResult.unwrap();
				hashedValue = plainPassword.getHashedValue();
			});

			And('I create a UserPassword from the hashed value', () => {
				const hashedResult = UserPassword.create({
					value: hashedValue,
					hashed: true,
				});
				expect(hashedResult.isOk()).toBeTruthy();

				createdPassword = hashedResult.unwrap();
				compareCorrect = createdPassword.comparePassword(rawPassword);
				compareWrong = createdPassword.comparePassword('wrong_password');
			});

			Then('comparing the hashed value with "supersecret" should succeed', () => {
				expect(compareCorrect).toBe(true);
			});

			And('comparing the hashed value with "wrong_password" should fail', () => {
				expect(compareWrong).toBe(false);
			});
		},
	);
});
