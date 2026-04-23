Feature: UserId value object
  Wraps a UniqueEntityID and protects it with basic guard rules.

  Scenario: Successfully create a user id from a UniqueEntityID
    Given I have a UniqueEntityID with value "123"
    When I create a UserId from that identifier
    Then the UserId result should be successful
    And the string value should be "123"

  Scenario: Fail to create a user id when the value is null
    Given I have a null UniqueEntityID
    When I create a UserId from that identifier
    Then the UserId result should be a failure
    And the error message should be "value is null or undefined"
