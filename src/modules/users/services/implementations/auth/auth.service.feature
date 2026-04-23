Feature: AuthService
	Validates token generation and cache-backed verification.

	Scenario: Generates and validates tokens
		Given I have a JWT payload with id "user-1"
		When I generate tokens with the auth service
		Then both tokens should be valid
		And both tokens should be stored in cache

	Scenario: Rejects tokens removed from cache
		Given I have generated tokens for user "user-2"
		And I remove the access token from cache
		When I try to verify the access token
		Then the verification should fail
