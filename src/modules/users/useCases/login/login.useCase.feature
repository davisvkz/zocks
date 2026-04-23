Feature: LoginUseCase
	Validates the behaviour of logging users in.

	Scenario: Successfully logs in with valid credentials
		Given there is a user with email "john@example.com" and password "123456"
		When I execute the login use case with email "john@example.com" and password "123456"
		Then the login should succeed
		And the tokens should be cached

	Scenario: Fails with wrong password
		Given there is a user with email "john@example.com" and password "123456"
		When I execute the login use case with email "john@example.com" and password "wrongpass"
		Then the login should fail due to invalid credentials

	Scenario: Fails with non existent user
		Given there is no user with email "ghost@example.com"
		When I execute the login use case with email "ghost@example.com" and password "anypass"
		Then the login should fail due to invalid credentials
