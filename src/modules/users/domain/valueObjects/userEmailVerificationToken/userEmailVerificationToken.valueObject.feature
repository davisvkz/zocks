Feature: EmailVerificationToken value object
  Handles generation, serialization and validation of email verification tokens.

  Scenario: Create a new email verification token
    When I create a new EmailVerificationToken
    Then the EmailVerificationToken result should be successful
    And the generated token should have 4 characters
    And the generated token should be uppercased
    And the generated token expiry should be in the future

  Scenario: Recreate a token from its raw JSON value
    Given I already have a generated EmailVerificationToken
    When I serialize it to JSON and recreate the token from that JSON
    Then the recreated EmailVerificationToken result should be successful
    And the recreated token should have the same token value
    And the recreated token expiry should be a Date instance
