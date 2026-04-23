Feature: CreateUserController
	Validates how the CreateUserController maps use case results to HTTP responses.

	Scenario: Successfully creates a new user
		Given I send a valid create user payload
		When the create user controller handles the request
		Then it should return HTTP status 200
		And the response body should be empty

	Scenario: Email is already registered
		Given I send a create user payload with an email that is already registered
		When the create user controller handles the request
		Then it should return HTTP status 409
		And the response message should contain "already exists"

	Scenario: Username is already taken
		Given I send a create user payload with a username that is already taken
		When the create user controller handles the request
		Then it should return HTTP status 409
		And the response message should contain "already taken"

	Scenario: An unexpected error happens
		Given the use case returns an unexpected error while creating the user
		When the create user controller handles the request
		Then it should return HTTP status 500
		And the response message should be "An unexpected error occurred."
