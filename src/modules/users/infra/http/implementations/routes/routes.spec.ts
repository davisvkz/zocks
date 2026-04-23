import 'reflect-metadata';

import type { AddressInfo } from 'node:net';
import { Err, Ok } from '@/core/Result';
import express from 'express';
import { container } from 'tsyringe';
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';

import type {
	AuthTokens,
	IAuthService,
	JWTPayload,
} from '../../../../services/interfaces/auth/auth.service';
import type { CreateUserUseCase } from '../../../../useCases/createUser/createUser.useCase';
import type { LoginUseCase } from '../../../../useCases/login/login.useCase';
import { CreateUserController } from '../../../../useCases/createUser/createUser.controller';
import { GetCurrentUserController } from '../../../../useCases/getCurrentUser/getCurrentUser.controller';
import { LoginController } from '../../../../useCases/login/login.controller';
import { AuthMiddlewareSymbol } from '../../interfaces/auth/auth.middleware';
import { AuthMiddleware } from '../auth/auth.middleware';

type MockAuthService = IAuthService & {
	generateTokens: ReturnType<typeof vi.fn>;
	verifyAccessToken: ReturnType<typeof vi.fn>;
	verifyRefreshToken: ReturnType<typeof vi.fn>;
};

type RouterWithStack = {
	stack?: Array<{
		route?: {
			path: string;
			methods: Record<string, boolean>;
		};
	}>;
};

const getRegisteredRoutes = (router: RouterWithStack): string[] =>
	(router.stack ?? [])
		.filter((layer) => layer.route)
		.flatMap((layer) => {
			const route = layer.route;

			if (!route) {
				return [];
			}

			return Object.entries(route.methods)
				.filter(([, enabled]) => enabled)
				.map(([method]) => `${method.toUpperCase()} ${route.path}`);
		})
		.sort();

describe('users express router contract', () => {
	let address: AddressInfo;
	let closeServer: () => Promise<void>;
	let createUserExecute: ReturnType<typeof vi.fn>;
	let loginExecute: ReturnType<typeof vi.fn>;
	let authService: MockAuthService;
	let userRouter: RouterWithStack;

	beforeAll(async () => {
		createUserExecute = vi.fn();
		loginExecute = vi.fn();
		authService = {
			generateTokens: vi.fn(),
			verifyAccessToken: vi.fn(),
			verifyRefreshToken: vi.fn(),
		} as MockAuthService;

		container.registerInstance(
			AuthMiddlewareSymbol,
			new AuthMiddleware(authService),
		);
		container.registerInstance(
			CreateUserController,
			new CreateUserController({
				execute: createUserExecute,
			} as unknown as CreateUserUseCase),
		);
		container.registerInstance(
			LoginController,
			new LoginController({ execute: loginExecute } as unknown as LoginUseCase),
		);
		container.registerInstance(
			GetCurrentUserController,
			new GetCurrentUserController(),
		);

		const routesModule = await import('./routes');
		userRouter = routesModule.userRouter as unknown as RouterWithStack;

		const app = express();
		app.use('/users', routesModule.userRouter);

		const server = app.listen(0);

		await new Promise<void>((resolve) => {
			server.once('listening', () => resolve());
		});

		address = server.address() as AddressInfo;
		closeServer = () =>
			new Promise<void>((resolve, reject) => {
				server.close((error) => {
					if (error) {
						reject(error);
						return;
					}

					resolve();
				});
			});
	});

	afterAll(async () => {
		await closeServer();
	});

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('registers only POST /auth/login, GET /me, and POST /post', () => {
		expect(getRegisteredRoutes(userRouter)).toEqual([
			'GET /me',
			'POST /auth/login',
			'POST /post',
		]);
	});

	it('mounts create-user at POST /users/post and leaves POST /users unmatched', async () => {
		createUserExecute.mockResolvedValueOnce(Ok<void>(undefined));

		const mountedResponse = await fetch(
			`http://127.0.0.1:${address.port}/users/post`,
			{
				method: 'POST',
				body: JSON.stringify({
					username: 'john_doe',
					email: 'john@example.com',
					password: '123456',
				}),
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);

		const unmatchedResponse = await fetch(
			`http://127.0.0.1:${address.port}/users`,
			{
				method: 'POST',
				body: JSON.stringify({
					username: 'john_doe',
					email: 'john@example.com',
					password: '123456',
				}),
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);

		expect(mountedResponse.status).toBe(200);
		expect(await mountedResponse.text()).toBe('');
		expect(unmatchedResponse.status).toBe(404);
		expect(await unmatchedResponse.text()).toBe('404 Not Found');
	});

	it('returns tokens from POST /users/auth/login', async () => {
		const tokens: AuthTokens = {
			accessToken: 'access-token',
			refreshToken: 'refresh-token',
			accessTokenExpiresIn: '1h',
			refreshTokenExpiresIn: '7d',
		};

		loginExecute.mockResolvedValueOnce(Ok(tokens));

		const response = await fetch(
			`http://127.0.0.1:${address.port}/users/auth/login`,
			{
				method: 'POST',
				body: JSON.stringify({
					email: 'john@example.com',
					password: '123456',
				}),
				headers: {
					'Content-Type': 'application/json',
				},
			},
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual(tokens);
	});

	it.each(['/users/auth/login', '/users/post'])(
		'returns a 500 JSON error for malformed JSON on %s',
		async (path) => {
			const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
				method: 'POST',
				body: '{"broken":',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			expect(response.status).toBe(500);
			expect(await response.json()).toEqual({
				message: 'An unexpected error occurred',
			});
		},
	);

	it('returns a 401 JSON error from GET /users/me when Authorization is missing', async () => {
		const response = await fetch(`http://127.0.0.1:${address.port}/users/me`);

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			message: 'No access token provided',
		});
	});

	it('returns a 403 JSON error from GET /users/me when bearer token validation fails', async () => {
		authService.verifyAccessToken.mockResolvedValueOnce(Err('invalid token'));

		const response = await fetch(`http://127.0.0.1:${address.port}/users/me`, {
			headers: {
				authorization: 'Bearer invalid-token',
			},
		});

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({
			message: 'Token expired or invalid',
		});
	});

	it('returns current-user JSON from GET /users/me when bearer token validation succeeds', async () => {
		const payload: JWTPayload = {
			sub: 'user-1',
			email: 'john@example.com',
			username: 'john_doe',
			isAdminUser: false,
		};

		authService.verifyAccessToken.mockResolvedValueOnce(Ok(payload));

		const response = await fetch(`http://127.0.0.1:${address.port}/users/me`, {
			headers: {
				authorization: 'Bearer valid-token',
			},
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			id: 'user-1',
			email: 'john@example.com',
			username: 'john_doe',
			isAdminUser: false,
		});
	});

	it('returns plain-text 404 for unmatched users routes', async () => {
		const response = await fetch(
			`http://127.0.0.1:${address.port}/users/not-a-route`,
		);

		expect(response.status).toBe(404);
		expect(await response.text()).toBe('404 Not Found');
	});
});
