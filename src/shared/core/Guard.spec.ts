import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';

import type { GuardResponse } from './Guard';
import type { Result } from './Result';
import { Guard } from './Guard';
import { Err, Ok } from './Result';

// @ts-expect-error await needed
const feature = await loadFeature('./Guard.feature');

describeFeature(feature, ({ Scenario }) => {
	Scenario(
		'combine succeeds when all results succeed',
		({ Given, When, Then }) => {
			let result: Result<void, GuardResponse>;
			let guardsResult: Result<void, GuardResponse>[] = [];

			Given('I have two successful guard results', () => {
				guardsResult = [Ok<void>(undefined), Ok<void>(undefined)];
			});

			When('I combine the guard results', () => {
				result = Guard.combine(guardsResult);
			});

			Then('the combined result should be successful', () => {
				expect(result.isOk()).toBeTruthy();
			});
		},
	);

	Scenario(
		'combine fails when any result fails',
		({ Given, When, Then, And }) => {
			let result: Result<void, GuardResponse>;
			let failureMessage = '';

			Given(
				'I have one successful guard result and one failed guard result with message "This one failed"',
				() => {
					failureMessage = 'This one failed';
				},
			);

			When('I combine the guard results', () => {
				result = Guard.combine([Ok<void>(undefined), Err(failureMessage)]);
			});

			Then('the combined result should be a failure', () => {
				expect(result.isOk()).toBeFalsy();
				expect(result.isErr()).toBeTruthy();
			});

			And('the combined error message should be "This one failed"', () => {
				expect(result.unwrapErr()).toEqual('This one failed');
			});
		},
	);

	Scenario(
		'againstNullOrUndefined returns success when value is provided',
		({ Given, When, Then }) => {
			let result: Result<void, GuardResponse>;
			let argName = '';

			Given('the argument name is "testArgument"', () => {
				argName = 'testArgument';
			});

			When('I check the value "true" with againstNullOrUndefined', () => {
				result = Guard.againstNullOrUndefined(true, argName);
			});

			Then('the guard result should be successful', () => {
				expect(result.isOk()).toBeTruthy();
			});
		},
	);

	Scenario(
		'againstNullOrUndefined returns failure when value is null',
		({ Given, When, Then, And }) => {
			let result: Result<void, GuardResponse>;
			let argName = '';

			Given('the argument name is "testArgument"', () => {
				argName = 'testArgument';
			});

			When('I check the value null with againstNullOrUndefined', () => {
				result = Guard.againstNullOrUndefined(null, argName);
			});

			Then('the guard result should be a failure', () => {
				expect(result.isOk()).toBeFalsy();
			});

			And(
				'the guard error message should be "testArgument is null or undefined"',
				() => {
					expect(result.unwrapErr()).toEqual('testArgument is null or undefined');
				},
			);
		},
	);

	Scenario(
		'againstNullOrUndefined returns failure when value is undefined',
		({ Given, When, Then, And }) => {
			let result: Result<void, GuardResponse>;
			let argName = '';

			Given('the argument name is "testArgument"', () => {
				argName = 'testArgument';
			});

			When('I check the value undefined with againstNullOrUndefined', () => {
				result = Guard.againstNullOrUndefined(undefined, argName);
			});

			Then('the guard result should be a failure', () => {
				expect(result.isOk()).toBeFalsy();
			});

			And(
				'the guard error message should be "testArgument is null or undefined"',
				() => {
					expect(result.unwrapErr()).toEqual('testArgument is null or undefined');
				},
			);
		},
	);

	Scenario(
		'againstNullOrUndefined returns success when value is an empty string',
		({ Given, When, Then }) => {
			let result: Result<void, GuardResponse>;
			let argName = '';

			Given('the argument name is "testArgument"', () => {
				argName = 'testArgument';
			});

			When('I check the value "" with againstNullOrUndefined', () => {
				result = Guard.againstNullOrUndefined('', argName);
			});

			Then('the guard result should be successful', () => {
				expect(result.isOk()).toBeTruthy();
			});
		},
	);

	Scenario(
		'againstNullOrUndefinedBulk returns success when all values are provided',
		({ Given, And, When, Then }) => {
			let result: Result<void, GuardResponse>;
			let argName = '';
			let secondaryArgName = '';

			Given('the argument name is "testArgument"', () => {
				argName = 'testArgument';
			});

			And('the secondary argument name is "secondaryTestArgument"', () => {
				secondaryArgName = 'secondaryTestArgument';
			});

			When('I call againstNullOrUndefinedBulk with values [true, 12]', () => {
				result = Guard.againstNullOrUndefinedBulk([
					{ argumentName: argName, argument: true },
					{ argumentName: secondaryArgName, argument: 12 },
				]);
			});

			Then('the guard result should be successful', () => {
				expect(result.isOk()).toBeTruthy();
			});
		},
	);

	Scenario(
		'againstNullOrUndefinedBulk returns failure when any value is null',
		({ Given, And, When, Then }) => {
			let result: Result<void, GuardResponse>;
			let argName = '';
			let secondaryArgName = '';

			Given('the argument name is "testArgument"', () => {
				argName = 'testArgument';
			});

			And('the secondary argument name is "secondaryTestArgument"', () => {
				secondaryArgName = 'secondaryTestArgument';
			});

			When(
				'I call againstNullOrUndefinedBulk with the first value null and the second value 12',
				() => {
					result = Guard.againstNullOrUndefinedBulk([
						{ argumentName: argName, argument: null },
						{ argumentName: secondaryArgName, argument: 12 },
					]);
				},
			);

			Then('the guard result should be a failure', () => {
				expect(result.isOk()).toBeFalsy();
			});

			And(
				'the guard error message should be "testArgument is null or undefined"',
				() => {
					expect(result.unwrapErr()).toEqual('testArgument is null or undefined');
				},
			);
		},
	);

	Scenario(
		'againstNullOrUndefinedBulk returns failure when any value is undefined',
		({ Given, And, When, Then }) => {
			let result: Result<void, GuardResponse>;
			let argName = '';
			let secondaryArgName = '';

			Given('the argument name is "testArgument"', () => {
				argName = 'testArgument';
			});

			And('the secondary argument name is "secondaryTestArgument"', () => {
				secondaryArgName = 'secondaryTestArgument';
			});

			When(
				'I call againstNullOrUndefinedBulk with the first value undefined and the second value 12',
				() => {
					result = Guard.againstNullOrUndefinedBulk([
						{ argumentName: argName, argument: undefined },
						{ argumentName: secondaryArgName, argument: 12 },
					]);
				},
			);

			Then('the guard result should be a failure', () => {
				expect(result.isOk()).toBeFalsy();
			});

			And(
				'the guard error message should be "testArgument is null or undefined"',
				() => {
					expect(result.unwrapErr()).toEqual('testArgument is null or undefined');
				},
			);
		},
	);
});
