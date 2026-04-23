Feature: authRepo
	Validates caching and invalidation of auth tokens.

	Scenario: isAccessTokenValid returns false for uncached token
		Given an empty cache
		When I check access token "access-1"
		Then the access token validity should be false

	Scenario: cacheAccessToken stores token for validation
		Given an empty cache
		When I cache access token "access-1" with ttl 60 seconds
		And I check access token "access-1"
		Then the access token validity should be true

	Scenario: invalidateAccessToken removes cached token
		Given an empty cache
		And I cache access token "access-1" with ttl 60 seconds
		And I invalidate access token "access-1"
		When I check access token "access-1"
		Then the access token validity should be false

	Scenario: cacheRefreshToken stores token for validation
		Given an empty cache
		When I cache refresh token "refresh-1" with ttl 120 seconds
		And I check refresh token "refresh-1"
		Then the refresh token validity should be true

	Scenario: invalidateRefreshToken removes cached token
		Given an empty cache
		And I cache refresh token "refresh-1" with ttl 120 seconds
		And I invalidate refresh token "refresh-1"
		When I check refresh token "refresh-1"
		Then the refresh token validity should be false

	Scenario: cached access tokens expire after ttl
		Given I cached an access token "expiring-token" with ttl 1 second
		When I wait 2 seconds
		And I check access token "expiring-token"
		Then the access token validity should be false
