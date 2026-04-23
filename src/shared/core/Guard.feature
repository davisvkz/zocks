Feature: Guard
	Validates Guard's utility functions for combining results and checking for null or undefined values.

	Scenario: combine succeeds when all results succeed
		Given I have two successful guard results
		When I combine the guard results
		Then the combined result should be successful

	Scenario: combine fails when any result fails
		Given I have one successful guard result and one failed guard result with message "This one failed"
		When I combine the guard results
		Then the combined result should be a failure
		And the combined error message should be "This one failed"

	Scenario: againstNullOrUndefined returns success when value is provided
		Given the argument name is "testArgument"
		When I check the value "true" with againstNullOrUndefined
		Then the guard result should be successful

	Scenario: againstNullOrUndefined returns failure when value is null
		Given the argument name is "testArgument"
		When I check the value null with againstNullOrUndefined
		Then the guard result should be a failure
		And the guard error message should be "testArgument is null or undefined"

	Scenario: againstNullOrUndefined returns failure when value is undefined
		Given the argument name is "testArgument"
		When I check the value undefined with againstNullOrUndefined
		Then the guard result should be a failure
		And the guard error message should be "testArgument is null or undefined"

	Scenario: againstNullOrUndefined returns success when value is an empty string
		Given the argument name is "testArgument"
		When I check the value "" with againstNullOrUndefined
		Then the guard result should be successful

	Scenario: againstNullOrUndefinedBulk returns success when all values are provided
		Given the argument name is "testArgument"
		And the secondary argument name is "secondaryTestArgument"
		When I call againstNullOrUndefinedBulk with values [true, 12]
		Then the guard result should be successful

	Scenario: againstNullOrUndefinedBulk returns failure when any value is null
		Given the argument name is "testArgument"
		And the secondary argument name is "secondaryTestArgument"
		When I call againstNullOrUndefinedBulk with the first value null and the second value 12
		Then the guard result should be a failure
		And the guard error message should be "testArgument is null or undefined"

	Scenario: againstNullOrUndefinedBulk returns failure when any value is undefined
		Given the argument name is "testArgument"
		And the secondary argument name is "secondaryTestArgument"
		When I call againstNullOrUndefinedBulk with the first value undefined and the second value 12
		Then the guard result should be a failure
		And the guard error message should be "testArgument is null or undefined"
