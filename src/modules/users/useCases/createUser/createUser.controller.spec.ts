import 'reflect-metadata';

import { AppError } from '@/core/AppError';
import { Err, Ok } from '@/core/Result';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';

import type { CreateUserDTO } from './createUser.dto';
import type { CreateUserUseCase } from './createUser.useCase';
import { CreateUserController } from './createUser.controller';
import { CreateUserErrors } from './createUser.errors';

const makeTransportRequest = (body: unknown) => ({
	req: {
		json: vi.fn().mockResolvedValue(body),
	},
	json: (payload: unknown, status: number) =>
		new Response(JSON.stringify(payload), {
			status,
			headers: {
				'Content-Type': 'application/json',
			},
		}),
	newResponse: (payload: BodyInit | null, status: number) =>
		new Response(payload, { status }),
});

// @ts-expect-error await needed
const feature = await loadFeature('./createUser.controller.feature');

describeFeature(feature, ({ Scenario, BeforeEachScenario }) => {
	let controller: CreateUserController;
	let useCase: CreateUserUseCase;
	let executeMock: ReturnType<typeof vi.fn>;

	BeforeEachScenario(() => {
		executeMock = vi.fn();

		useCase = {
			execute: executeMock,
		} as unknown as CreateUserUseCase;

		controller = new CreateUserController(useCase);
	});

	Scenario('Successfully creates a new user', ({ Given, When, Then, And }) => {
		let payload: CreateUserDTO;
		let response: Response;

		Given('I send a valid create user payload', () => {
			payload = {
				username: 'john_doe',
				email: 'john@example.com',
				password: '123456',
			};

			executeMock.mockResolvedValueOnce(Ok<void>(undefined));
		});

		When('the create user controller handles the request', async () => {
			response = await controller.execute(makeTransportRequest(payload));
		});

		Then('it should return HTTP status 200', () => {
			expect(response.status).toBe(200);
		});

		And('the response body should be empty', async () => {
			const text = await response.text();
			expect(text).toBe('');
		});
	});

	Scenario('Email is already registered', ({ Given, When, Then, And }) => {
		let payload: CreateUserDTO;
		let response: Response;

		Given(
			'I send a create user payload with an email that is already registered',
			() => {
				payload = {
					username: 'john_doe',
					email: 'john@example.com',
					password: '123456',
				};

				const error = new CreateUserErrors.EmailAlreadyExistsError(payload.email);

				executeMock.mockResolvedValueOnce(Err(error));
			},
		);

		When('the create user controller handles the request', async () => {
			response = await controller.execute(makeTransportRequest(payload));
		});

		Then('it should return HTTP status 409', () => {
			expect(response.status).toBe(409);
		});

		And('the response message should contain "already exists"', async () => {
			const body = (await response.json()) as { message: string };
			expect(body.message).toContain('already exists');
		});
	});

	Scenario('Username is already taken', ({ Given, When, Then, And }) => {
		let payload: CreateUserDTO;
		let response: Response;

		Given(
			'I send a create user payload with a username that is already taken',
			() => {
				payload = {
					username: 'john_doe',
					email: 'john@example.com',
					password: '123456',
				};

				const error = new CreateUserErrors.UsernameTakenError(payload.username);

				executeMock.mockResolvedValueOnce(Err(error));
			},
		);

		When('the create user controller handles the request', async () => {
			response = await controller.execute(makeTransportRequest(payload));
		});

		Then('it should return HTTP status 409', () => {
			expect(response.status).toBe(409);
		});

		And('the response message should contain "already taken"', async () => {
			const body = (await response.json()) as { message: string };
			expect(body.message).toContain('already taken');
		});
	});

	Scenario('An unexpected error happens', ({ Given, When, Then, And }) => {
		let payload: CreateUserDTO;
		let response: Response;

		Given(
			'the use case returns an unexpected error while creating the user',
			() => {
				payload = {
					username: 'john_doe',
					email: 'john@example.com',
					password: '123456',
				};

				const error = AppError.UnexpectedError.create(
					new Error('Unexpected failure'),
				);

				executeMock.mockResolvedValueOnce(Err(error));
			},
		);

		When('the create user controller handles the request', async () => {
			response = await controller.execute(makeTransportRequest(payload));
		});

		Then('it should return HTTP status 500', () => {
			expect(response.status).toBe(500);
		});

		And(
			'the response message should be "An unexpected error occurred."',
			async () => {
				const body = (await response.json()) as { message: string };
				expect(body.message).toBe('An unexpected error occurred.');
			},
		);
	});
});
