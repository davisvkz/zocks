Feature: MockDatabaseRepo
  Validates the behaviour of the in-memory database implementation used in tests.

  Scenario: Inserts and finds a single row
    Given I have an empty mock database
    When I insert a user with id "1" and name "John" into the "users" table
    Then I should be able to find a user in the "users" table
    And the found user should have id "1" and name "John"

  Scenario: Finds a row by where clause
    Given I have an empty mock database
    And I have two users in the "users" table
    When I search in the "users" table for the user with id "2"
    Then I should get back only the user with id "2"

  Scenario: Returns all rows with findAll
    Given I have an empty mock database
    And I have two users in the "users" table
    When I list all users in the "users" table
    Then I should get 2 rows back

  Scenario: Updates a row matched by where clause
    Given I have an empty mock database
    And I have a user with id "1" and name "John" in the "users" table
    When I update the user with id "1" in the "users" table changing the name to "Johnny"
    Then I should be able to find a user in the "users" table
    And the found user should have id "1" and name "Johnny"

  Scenario: Deletes rows matched by where clause
    Given I have an empty mock database
    And I have two users in the "users" table
    When I delete users from the "users" table with the id "1"
    Then I should get 1 row back when I list all users in the "users" table
    And the remaining user should have id "2"
