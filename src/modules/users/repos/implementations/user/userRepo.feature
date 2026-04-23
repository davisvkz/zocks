Feature: userRepo
	Validates the behaviour of the user repository.

	Scenario: exists returns false when there is no user with the given email
		Given an empty users table
		When I check if a user exists with email "john@example.com"
		Then the exists result should be false

	Scenario: exists returns true when a user with the given email exists
		Given an empty users table
		And I save a user with username "john_doe" and email "john@example.com"
		When I check if a user exists with email "john@example.com"
		Then the exists result should be true

	Scenario: getUserByUserId returns failure when user does not exist
		Given an empty users table
		When I get a user by id "non-existent-id"
		Then the getUserByUserId result should be a failure with message "User Not Founded"

	Scenario: getUserByUserId returns the persisted user
		Given an empty users table
		And I save a user with username "john_doe" and email "john@example.com"
		When I get that user by its id
		Then the getUserByUserId result should be successful
		And the returned user username should be "john_doe"
		And the returned user email should be "john@example.com"

	Scenario: getUserByUserName returns failure when user does not exist
		Given an empty users table
		When I get a user by username "unknown_user"
		Then the getUserByUserName result should be a failure with message "no user found"

	Scenario: getUserByUserName returns the persisted user
		Given an empty users table
		And I save a user with username "john_doe" and email "john@example.com"
		When I get a user by username "john_doe"
		Then the getUserByUserName result should be successful
		And the returned user username should be "john_doe"
		And the returned user email should be "john@example.com"
