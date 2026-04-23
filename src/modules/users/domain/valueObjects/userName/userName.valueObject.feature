Feature: UserName value object
  Validates username constraints such as null, min length and max length.

  Scenario: Successfully create a valid username
    Given I provide the username "john_doe"
    When I create a UserName
    Then the UserName result should be successful
    And the stored username value should be "john_doe"

  Scenario: Fail when username is null
    Given I provide a null username
    When I create a UserName
    Then the UserName result should be a failure
    And the error message should be "username is null or undefined"

  Scenario: Fail when username is too short
    Given I provide the username "a"
    When I create a UserName
    Then the UserName result should be a failure
    And the error message should be "Text is not at least 2 chars."

  Scenario: Fail when username is too long
    Given I provide a username longer than 15 characters
    When I create a UserName
    Then the UserName result should be a failure
    And the error message should be "Text is greater than 15 chars."
