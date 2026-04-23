import 'reflect-metadata';

import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';

import { MockCacheRepo } from './mock.service';

// @ts-expect-error await needed
const feature = await loadFeature('./mock.service.feature');

describeFeature(feature, ({ Scenario }) => {
	Scenario(
		'Stores and retrieves a value without TTL',
		({ Given, When, Then, And }) => {
			let cache: MockCacheRepo;
			let value: string | null;

			Given('I have an empty cache mock', () => {
				cache = new MockCacheRepo();
			});

			When('I set the key "user:1" with value "John" without TTL', async () => {
				await cache.set('user:1', 'John');
			});

			Then('the cache should report that "user:1" exists', async () => {
				const exists = await cache.exists('user:1');
				expect(exists).toBeTruthy();
			});

			And('I should get the value "John" back for "user:1"', async () => {
				value = await cache.get('user:1');
				expect(value).toBe('John');
			});
		},
	);

	Scenario(
		'Returns false and null for a missing key',
		({ Given, When, Then, And }) => {
			let cache: MockCacheRepo;
			let exists: boolean;
			let value: string | null;

			Given('I have an empty cache mock', () => {
				cache = new MockCacheRepo();
			});

			When('I check if the key "missing" exists', async () => {
				exists = await cache.exists('missing');
			});

			Then('the cache should report that "missing" does not exist', () => {
				expect(exists).toBeFalsy();
			});

			And('I should get null back for "missing"', async () => {
				value = await cache.get('missing');
				expect(value).toBeNull();
			});
		},
	);

	Scenario('Deletes an existing key', ({ Given, When, Then }) => {
		let cache: MockCacheRepo;

		Given('I have a cache mock with key "session:1" set to "abc"', async () => {
			cache = new MockCacheRepo();
			await cache.set('session:1', 'abc');
		});

		When('I delete the key "session:1"', async () => {
			await cache.delete('session:1');
		});

		Then('the cache should report that "session:1" does not exist', async () => {
			const exists = await cache.exists('session:1');
			expect(exists).toBeFalsy();
		});
	});

	Scenario('Expires a key after TTL elapses', ({ Given, When, Then, And }) => {
		let cache: MockCacheRepo;
		let originalNow: () => number;

		Given('I have an empty cache mock', () => {
			cache = new MockCacheRepo();
		});

		When(
			'I set the key "temp" with value "123" with TTL of 1 second',
			async () => {
				originalNow = Date.now;
				(Date.now as any) = () => 0;
				await cache.set('temp', '123', 1);
			},
		);

		And('I simulate that 2 seconds have passed', () => {
			(Date.now as any) = () => 2000;
		});

		Then(
			'the cache should report that "temp" does not exist anymore',
			async () => {
				const exists = await cache.exists('temp');
				expect(exists).toBeFalsy();
			},
		);

		And('I should get null back for "temp"', async () => {
			const value = await cache.get('temp');
			expect(value).toBeNull();

			(Date.now as any) = originalNow;
		});
	});
});
