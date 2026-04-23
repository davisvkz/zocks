Feature: MockCacheRepo
  Validates the behaviour of the in-memory cache implementation used in tests.

  Scenario: Stores and retrieves a value without TTL
    Given I have an empty cache mock
    When I set the key "user:1" with value "John" without TTL
    Then the cache should report that "user:1" exists
    And I should get the value "John" back for "user:1"

  Scenario: Returns false and null for a missing key
    Given I have an empty cache mock
    When I check if the key "missing" exists
    Then the cache should report that "missing" does not exist
    And I should get null back for "missing"

  Scenario: Deletes an existing key
    Given I have a cache mock with key "session:1" set to "abc"
    When I delete the key "session:1"
    Then the cache should report that "session:1" does not exist

  Scenario: Expires a key after TTL elapses
    Given I have an empty cache mock
    When I set the key "temp" with value "123" with TTL of 1 second
    And I simulate that 2 seconds have passed
    Then the cache should report that "temp" does not exist anymore
    And I should get null back for "temp"
