import type {
	ControllerRequest,
	ControllerResponse,
} from '@/infra/http/interfaces/BaseController';
import { AppError } from '@/core/AppError';
import { BaseController } from '@/infra/http/interfaces/BaseController';
import { TextUtils } from '@/utils/textUtils';
import { injectable } from 'tsyringe';

import type { CreateUserDTO } from './createUser.dto';
import { CreateUserErrors } from './createUser.errors';
import { CreateUserUseCase } from './createUser.useCase';

type RequestWithJsonBody = {
	req: {
		json: () => Promise<unknown>;
	};
};

type ResponseFactory = {
	json: (body: unknown, status: number) => Response;
	newResponse: (body: BodyInit | null, status: number) => Response;
};

type TransportRequest = RequestWithJsonBody & ResponseFactory;

@injectable()
export class CreateUserController extends BaseController {
	constructor(private useCase: CreateUserUseCase) {
		super();
	}

	public async execute(request: TransportRequest): Promise<Response>;
	public async execute(request: ControllerRequest): Promise<ControllerResponse>;
	public async execute(
		request: TransportRequest | ControllerRequest,
	): Promise<Response | ControllerResponse> {
		if (!this.isTransportRequest(request)) {
			return super.execute(request);
		}

		try {
			const body = await request.req.json();
			const response = await super.execute({ body });

			return this.toTransportResponse(request, response);
		} catch (err) {
			console.error('[BaseController]: Uncaught controller error');
			console.error(err);
			return this.toTransportResponse(
				request,
				this.fail('An unexpected error occurred'),
			);
		}
	}

	async executeImpl(
		request: ControllerRequest,
	): Promise<ControllerResponse | void> {
		const body = request.body;

		if (!this.isValidPayload(body)) {
			return this.clientError('Invalid payload');
		}

		const dto: CreateUserDTO = {
			username: TextUtils.sanitize(body.username),
			email: TextUtils.sanitize(body.email),
			password: body.password,
		};

		try {
			const result = await this.useCase.execute(dto);

			if (result.isErr()) {
				const error = result.unwrapErr() as unknown;

				if (error instanceof CreateUserErrors.UsernameTakenError) {
					return this.conflict(error.message);
				}

				if (error instanceof CreateUserErrors.EmailAlreadyExistsError) {
					return this.conflict(error.message);
				}

				if (error instanceof AppError.UnexpectedError) {
					return this.fail(error.message);
				}

				const fallbackMessage =
					typeof error === 'string'
						? error
						: typeof error === 'object' &&
							  error !== null &&
							  'message' in error &&
							  typeof (error as { message: unknown }).message === 'string'
							? (error as { message: string }).message
							: 'Unexpected error';

				return this.fail(fallbackMessage);
			}

			return this.ok();
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			return this.fail(message);
		}
	}

	private isTransportRequest(
		request: TransportRequest | ControllerRequest,
	): request is TransportRequest {
		if (!request || typeof request !== 'object') {
			return false;
		}

		const candidate = request as Partial<TransportRequest>;

		return (
			typeof candidate.json === 'function' &&
			typeof candidate.newResponse === 'function' &&
			typeof candidate.req === 'object' &&
			candidate.req !== null &&
			typeof candidate.req.json === 'function'
		);
	}

	private toTransportResponse(
		request: ResponseFactory,
		response: ControllerResponse,
	): Response {
		if (response.body === undefined) {
			return request.newResponse(null, response.statusCode);
		}

		return request.json(response.body, response.statusCode);
	}

	private isValidPayload(body: unknown): body is CreateUserDTO {
		if (!body || typeof body !== 'object') {
			return false;
		}

		const candidate = body as Partial<CreateUserDTO>;

		return (
			typeof candidate.username === 'string' &&
			typeof candidate.email === 'string' &&
			typeof candidate.password === 'string'
		);
	}
}
