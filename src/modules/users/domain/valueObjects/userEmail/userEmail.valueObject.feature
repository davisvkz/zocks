Feature: UserEmail value object
  Validates creation and normalization of user email addresses.

  Scenario: Successfully create a user email
    Given I have the raw email "JOHN@example.COM "
    When I create a UserEmail
    Then the UserEmail result should be successful
    And the stored email value should be "john@example.com"

  Scenario: Fail to create a user email with an invalid format
    Given I have the raw email "invalid-email"
    When I create a UserEmail
    Then the UserEmail result should be a failure
    And the error message should be "Email address not valid"
