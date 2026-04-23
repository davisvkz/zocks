import 'reflect-metadata';

import { UniqueEntityID } from '@/domain/UniqueEntityID';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';

import { UserId } from './userId.valueObject';

// @ts-expect-error await needed
const feature = await loadFeature('./userId.valueObject.feature');

describeFeature(feature, ({ Scenario, BeforeEachScenario }) => {
	let uniqueId: UniqueEntityID | null;
	let result: ReturnType<typeof UserId.create>;

	BeforeEachScenario(() => {
		uniqueId = null;
	});

	Scenario(
		'Successfully create a user id from a UniqueEntityID',
		({ Given, When, Then, And }) => {
			Given('I have a UniqueEntityID with value "123"', () => {
				uniqueId = new UniqueEntityID('123');
			});

			When('I create a UserId from that identifier', () => {
				result = UserId.create(uniqueId);
			});

			Then('the UserId result should be successful', () => {
				expect(result.isOk()).toBeTruthy();
			});

			And('the string value should be "123"', () => {
				const userId = result.unwrap();
				expect(userId.getStringValue()).toBe('123');
			});
		},
	);

	Scenario(
		'Fail to create a user id when the value is null',
		({ Given, When, Then, And }) => {
			Given('I have a null UniqueEntityID', () => {
				uniqueId = null;
			});

			When('I create a UserId from that identifier', () => {
				result = UserId.create(uniqueId);
			});

			Then('the UserId result should be a failure', () => {
				expect(result.isErr()).toBeTruthy();
			});

			And('the error message should be "value is null or undefined"', () => {
				expect(result.unwrapErr()).toBe('value is null or undefined');
			});
		},
	);
});
