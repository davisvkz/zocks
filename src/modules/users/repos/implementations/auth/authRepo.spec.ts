import 'reflect-metadata';

import { MockCacheRepo } from '@/repo/implementations/cache/mock/mock.service';
import { CacheSymbol } from '@/repo/interfaces/cache';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { container } from 'tsyringe';

import { AuthRepo } from './authRepo';

// @ts-expect-error await needed
const feature = await loadFeature('./authRepo.feature');

describeFeature(feature, ({ Scenario, BeforeEachScenario }) => {
	let repo: AuthRepo;
	let accessValidity: boolean | undefined;
	let refreshValidity: boolean | undefined;

	BeforeEachScenario(() => {
		container.clearInstances();
		container.registerSingleton(CacheSymbol, MockCacheRepo);
		repo = container.resolve(AuthRepo);
		accessValidity = undefined;
		refreshValidity = undefined;
	});

	Scenario(
		'isAccessTokenValid returns false for uncached token',
		({ Given, When, Then }) => {
			Given('an empty cache', () => {});

			When('I check access token "access-1"', async () => {
				accessValidity = await repo.isAccessTokenValid('access-1');
			});

			Then('the access token validity should be false', () => {
				expect(accessValidity).toBe(false);
			});
		},
	);

	Scenario(
		'cacheAccessToken stores token for validation',
		({ Given, When, And, Then }) => {
			Given('an empty cache', () => {});

			When('I cache access token "access-1" with ttl 60 seconds', async () => {
				await repo.cacheAccessToken('access-1', 60);
			});

			And('I check access token "access-1"', async () => {
				accessValidity = await repo.isAccessTokenValid('access-1');
			});

			Then('the access token validity should be true', () => {
				expect(accessValidity).toBe(true);
			});
		},
	);

	Scenario(
		'invalidateAccessToken removes cached token',
		({ Given, And, When, Then }) => {
			Given('an empty cache', () => {});

			And('I cache access token "access-1" with ttl 60 seconds', async () => {
				await repo.cacheAccessToken('access-1', 60);
			});

			And('I invalidate access token "access-1"', async () => {
				await repo.invalidateAccessToken('access-1');
			});

			When('I check access token "access-1"', async () => {
				accessValidity = await repo.isAccessTokenValid('access-1');
			});

			Then('the access token validity should be false', () => {
				expect(accessValidity).toBe(false);
			});
		},
	);

	Scenario(
		'cacheRefreshToken stores token for validation',
		({ Given, When, And, Then }) => {
			Given('an empty cache', () => {});

			When('I cache refresh token "refresh-1" with ttl 120 seconds', async () => {
				await repo.cacheRefreshToken('refresh-1', 120);
			});

			And('I check refresh token "refresh-1"', async () => {
				refreshValidity = await repo.isRefreshTokenValid('refresh-1');
			});

			Then('the refresh token validity should be true', () => {
				expect(refreshValidity).toBe(true);
			});
		},
	);

	Scenario(
		'invalidateRefreshToken removes cached token',
		({ Given, And, When, Then }) => {
			Given('an empty cache', () => {});

			And('I cache refresh token "refresh-1" with ttl 120 seconds', async () => {
				await repo.cacheRefreshToken('refresh-1', 120);
			});

			And('I invalidate refresh token "refresh-1"', async () => {
				await repo.invalidateRefreshToken('refresh-1');
			});

			When('I check refresh token "refresh-1"', async () => {
				refreshValidity = await repo.isRefreshTokenValid('refresh-1');
			});

			Then('the refresh token validity should be false', () => {
				expect(refreshValidity).toBe(false);
			});
		},
	);

	Scenario(
		'cached access tokens expire after ttl',
		({ Given, When, And, Then }) => {
			Given(
				'I cached an access token "expiring-token" with ttl 1 second',
				async () => {
					await repo.cacheAccessToken('expiring-token', 1);
				},
			);

			When('I wait 2 seconds', async () => {
				await new Promise((resolve) => setTimeout(resolve, 1200));
			});

			And('I check access token "expiring-token"', async () => {
				accessValidity = await repo.isAccessTokenValid('expiring-token');
			});

			Then('the access token validity should be false', () => {
				expect(accessValidity).toBe(false);
			});
		},
	);
});
