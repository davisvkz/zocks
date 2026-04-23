Feature: Auth middleware
  Scenario: Includes decoded token when a valid bearer token exists
    Given a request with authorization header "Bearer valid-token"
    And the auth service will validate "valid-token" as user "user-1"
    When I run includeDecodedTokenIfExists middleware
    Then the auth state should be stored in response locals
    And the next handler should be called

  Scenario: Skips token processing when no authorization header exists
    Given a request without an authorization header
    When I run includeDecodedTokenIfExists middleware
    Then no auth state should be stored in response locals
    And the next handler should be called

  Scenario: Uses the raw authorization header when it is not bearer-prefixed
    Given a request with authorization header "raw-token"
    And the auth service will validate "raw-token" as user "user-1"
    When I run ensureAuthenticated middleware
    Then the raw token should be verified and stored in response locals
    And the next handler should be called

  Scenario: Blocks unauthenticated requests without a token
    Given a request without an authorization header
    When I run ensureAuthenticated middleware
    Then the response should have status 401
    And the response message should be "No access token provided"

  Scenario: Blocks requests with an invalid token
    Given a request with authorization header "Bearer invalid-token"
    And the auth service will reject tokens
    When I run ensureAuthenticated middleware
    Then the response should have status 403
    And the response message should be "Token expired or invalid"

  Scenario: Allows requests with a valid token
    Given a request with authorization header "Bearer valid-token"
    And the auth service will validate "valid-token" as user "user-2"
    When I run ensureAuthenticated middleware
    Then the auth state should be stored in response locals
    And the next handler should be called
