Feature: CreateUserUseCase
	Validates the behaviour of the create user use case.

	Scenario: Successfully creates a new user
		Given I have a valid user payload with username "john_doe", email "john@example.com" and password "123456"
		When I execute the create user use case
		Then the result should be successful
		And the user should be persisted in the database

	Scenario: Fails when email already exists
		Given I have a valid user payload with username "john_doe", email "john@example.com" and password "123456"
		And there is already a user with email "john@example.com" in the system
		When I execute the create user use case again
		Then the result should be a failure because the email already exists

	Scenario: Fails when username is already taken
		Given I have two users with the same username but different emails
		When I try to create the second user
		Then the result should be a failure because the username is taken
