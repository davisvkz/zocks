Feature: UserPassword value object
  Validates and hashes passwords, handling both raw and already hashed values.

  Scenario: Successfully create a valid password
    Given I provide the password "supersecret"
    When I create a UserPassword without the hashed flag
    Then the UserPassword result should be successful
    And the stored password value should be "supersecret"

  Scenario: Fail when password is too short
    Given I provide the password "123"
    When I create a UserPassword without the hashed flag
    Then the UserPassword result should be a failure
    And the error message should be "Password doesnt meet criteria [8 chars min]."

  Scenario: Allow already hashed passwords without enforcing length
    Given I provide a hashed password value shorter than the minimum length
    When I create a UserPassword with the hashed flag
    Then the UserPassword result should be successful

  Scenario: Compare hashed passwords correctly
    Given I provide the password "supersecret"
    When I hash the password using UserPassword
    And I create a UserPassword from the hashed value
    Then comparing the hashed value with "supersecret" should succeed
    And comparing the hashed value with "wrong_password" should fail
