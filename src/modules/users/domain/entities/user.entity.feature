Feature: UserEntity
	Validates the behaviour of the User aggregate.

	Scenario: Successfully creates a new user
		Given I have a valid username "john_doe", email "john@example.com" and password "123456"
		When I create a new user entity
		Then the user creation result should be successful
		And the user should have default flags set
		And the user should have a UserCreated domain event

	Scenario: Fails when username is missing
		Given I have an email "john@example.com" and password "123456" but no username
		When I try to create a new user entity
		Then the user creation result should be a failure
		And the user creation error message should be "username is null or undefined"

	Scenario: Fails when email is missing
		Given I have a username "john_doe" and password "123456" but no email
		When I try to create a new user entity
		Then the user creation result should be a failure
		And the user creation error message should be "email is null or undefined"

	Scenario: Creates an existing user without raising a UserCreated event
		Given I have a persisted user id
		And a valid username "persisted_user", email "persisted@example.com" and password "123456"
		When I create a user entity with the existing id
		Then the user creation result should be successful
		And the user should not have a UserCreated domain event

	Scenario: Deletes a user and raises UserDeleted event
		Given I have a valid username "to_delete", email "delete@example.com" and password "123456"
		And I create a new user entity
		When I delete the user
		Then the user should be marked as deleted
		And the user should have a UserDeleted domain event

	Scenario: Deleting an already deleted user should be idempotent
		Given I have a valid username "already_deleted", email "deleted@example.com" and password "123456"
		And I create a new user entity
		And I delete the user
		When I delete the user again
		Then the user should still be marked as deleted
		And the user should only have one UserDeleted domain event
