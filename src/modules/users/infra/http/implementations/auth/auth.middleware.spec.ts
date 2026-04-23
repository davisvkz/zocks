import 'reflect-metadata';

import { Err, Ok } from '@/core/Result';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { vi } from 'vitest';

import type {
	IAuthService,
	JWTPayload,
} from '../../../../../users/services/interfaces/auth/auth.service';
import type {
	AuthMiddlewareNext,
	AuthMiddlewareRequest,
	AuthMiddlewareResponse,
	IAuthMiddleware,
} from '../../interfaces/auth/auth.middleware';
import { AuthMiddleware } from './auth.middleware';

type MockResponse = AuthMiddlewareResponse & {
	statusMock: ReturnType<typeof vi.fn>;
	jsonMock: ReturnType<typeof vi.fn>;
	body?: { message: string };
	statusCode?: 401 | 403;
};

function createMockAuthService(): IAuthService & {
	verifyAccessToken: ReturnType<typeof vi.fn>;
} {
	const generateTokens = vi.fn();
	const verifyAccessToken = vi.fn();
	const verifyRefreshToken = vi.fn();

	return {
		generateTokens,
		verifyAccessToken,
		verifyRefreshToken,
	} as IAuthService & {
		verifyAccessToken: typeof verifyAccessToken;
	};
}

function createMockRequest(authorization?: string): AuthMiddlewareRequest {
	return {
		headers: authorization ? { authorization } : {},
	};
}

function createMockResponse(): MockResponse {
	const response = {
		locals: {},
		statusCode: undefined,
		body: undefined,
		statusMock: vi.fn(),
		jsonMock: vi.fn(),
	} as MockResponse;

	response.status = response.statusMock.mockImplementation((code: 401 | 403) => {
		response.statusCode = code;
		return response;
	}) as unknown as MockResponse['status'];

	response.json = response.jsonMock.mockImplementation(
		(body: { message: string }) => {
			response.body = body;
		},
	) as unknown as MockResponse['json'];

	return response;
}

// @ts-expect-error await needed
const feature = await loadFeature('./auth.middleware.feature');

describeFeature(feature, ({ Scenario, BeforeEachScenario }) => {
	let mockAuthService: IAuthService & {
		verifyAccessToken: ReturnType<typeof vi.fn>;
	};
	let middleware: IAuthMiddleware;
	let request: AuthMiddlewareRequest;
	let response: MockResponse;
	let next: ReturnType<typeof vi.fn> & AuthMiddlewareNext;
	let payload: JWTPayload;

	BeforeEachScenario(() => {
		mockAuthService = createMockAuthService();
		middleware = new AuthMiddleware(mockAuthService);
		request = createMockRequest();
		response = createMockResponse();
		next = vi.fn().mockResolvedValue(undefined) as ReturnType<typeof vi.fn> &
			AuthMiddlewareNext;
		payload = {
			sub: 'user-1',
			email: 'user1@example.com',
			username: 'user1',
			isAdminUser: false,
		};
	});

	Scenario(
		'Includes decoded token when a valid bearer token exists',
		({ Given, And, When, Then }) => {
			Given('a request with authorization header "Bearer valid-token"', () => {
				request = createMockRequest('Bearer valid-token');
			});

			And('the auth service will validate "valid-token" as user "user-1"', () => {
				mockAuthService.verifyAccessToken.mockResolvedValue(Ok(payload));
			});

			When('I run includeDecodedTokenIfExists middleware', async () => {
				await middleware.includeDecodedTokenIfExists()(request, response, next);
			});

			Then('the auth state should be stored in response locals', () => {
				expect(response.locals.auth).toEqual({
					user: payload,
					token: 'valid-token',
				});
			});

			And('the next handler should be called', () => {
				expect(next).toHaveBeenCalledTimes(1);
				expect(response.statusMock).not.toHaveBeenCalled();
				expect(response.jsonMock).not.toHaveBeenCalled();
			});
		},
	);

	Scenario(
		'Skips token processing when no authorization header exists',
		({ Given, When, Then, And }) => {
			Given('a request without an authorization header', () => {
				request = createMockRequest();
			});

			When('I run includeDecodedTokenIfExists middleware', async () => {
				await middleware.includeDecodedTokenIfExists()(request, response, next);
			});

			Then('no auth state should be stored in response locals', () => {
				expect(response.locals.auth).toBeUndefined();
				expect(mockAuthService.verifyAccessToken).not.toHaveBeenCalled();
			});

			And('the next handler should be called', () => {
				expect(next).toHaveBeenCalledTimes(1);
			});
		},
	);

	Scenario(
		'Uses the raw authorization header when it is not bearer-prefixed',
		({ Given, And, When, Then }) => {
			Given('a request with authorization header "raw-token"', () => {
				request = createMockRequest('raw-token');
			});

			And('the auth service will validate "raw-token" as user "user-1"', () => {
				mockAuthService.verifyAccessToken.mockResolvedValue(Ok(payload));
			});

			When('I run ensureAuthenticated middleware', async () => {
				await middleware.ensureAuthenticated()(request, response, next);
			});

			Then(
				'the raw token should be verified and stored in response locals',
				() => {
					expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith(
						'raw-token',
					);
					expect(response.locals.auth).toEqual({
						user: payload,
						token: 'raw-token',
					});
				},
			);

			And('the next handler should be called', () => {
				expect(next).toHaveBeenCalledTimes(1);
			});
		},
	);

	Scenario(
		'Blocks unauthenticated requests without a token',
		({ Given, When, Then, And }) => {
			Given('a request without an authorization header', () => {
				request = createMockRequest();
			});

			When('I run ensureAuthenticated middleware', async () => {
				await middleware.ensureAuthenticated()(request, response, next);
			});

			Then('the response should have status 401', () => {
				expect(response.statusCode).toBe(401);
			});

			And('the response message should be "No access token provided"', () => {
				expect(response.body).toEqual({
					message: 'No access token provided',
				});
				expect(next).not.toHaveBeenCalled();
			});
		},
	);

	Scenario(
		'Blocks requests with an invalid token',
		({ Given, And, When, Then }) => {
			Given('a request with authorization header "Bearer invalid-token"', () => {
				request = createMockRequest('Bearer invalid-token');
			});

			And('the auth service will reject tokens', () => {
				mockAuthService.verifyAccessToken.mockResolvedValue(Err('invalid token'));
			});

			When('I run ensureAuthenticated middleware', async () => {
				await middleware.ensureAuthenticated()(request, response, next);
			});

			Then('the response should have status 403', () => {
				expect(response.statusCode).toBe(403);
			});

			And('the response message should be "Token expired or invalid"', () => {
				expect(response.body).toEqual({ message: 'Token expired or invalid' });
				expect(response.locals.auth).toBeUndefined();
				expect(next).not.toHaveBeenCalled();
			});
		},
	);

	Scenario(
		'Allows requests with a valid token',
		({ Given, And, When, Then }) => {
			Given('a request with authorization header "Bearer valid-token"', () => {
				request = createMockRequest('Bearer valid-token');
			});

			And('the auth service will validate "valid-token" as user "user-2"', () => {
				payload = {
					sub: 'user-2',
					email: 'user2@example.com',
					username: 'user2',
					isAdminUser: false,
				};

				mockAuthService.verifyAccessToken.mockResolvedValue(Ok(payload));
			});

			When('I run ensureAuthenticated middleware', async () => {
				await middleware.ensureAuthenticated()(request, response, next);
			});

			Then('the auth state should be stored in response locals', () => {
				expect(response.locals.auth).toEqual({
					user: payload,
					token: 'valid-token',
				});
			});

			And('the next handler should be called', () => {
				expect(next).toHaveBeenCalledTimes(1);
				expect(response.statusMock).not.toHaveBeenCalled();
				expect(response.jsonMock).not.toHaveBeenCalled();
			});
		},
	);
});
