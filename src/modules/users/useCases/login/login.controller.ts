import type {
	ControllerRequest,
	ControllerResponse,
} from '@/infra/http/interfaces/BaseController';
import { AppError } from '@/core/AppError';
import { BaseController } from '@/infra/http/interfaces/BaseController';
import { TextUtils } from '@/utils/textUtils';
import { container } from 'tsyringe';

import type { LoginDTO } from './login.dto';
import type { LoginUseCase } from './login.useCase';
import { LoginErrors } from './login.errors';
import { LoginUseCaseSymbol } from './login.useCase';

export class LoginController extends BaseController {
	constructor(private readonly useCase: LoginUseCase) {
		super();
	}

	async executeImpl(
		request: ControllerRequest,
	): Promise<ControllerResponse | void> {
		const body = request.body;

		if (!this.isValidPayload(body)) {
			return this.clientError('Invalid payload');
		}

		const dto: LoginDTO = {
			email: TextUtils.sanitize(body.email),
			password: body.password,
		};

		try {
			const result = await this.useCase.execute(dto);

			if (result.isErr()) {
				const error = result.unwrapErr() as unknown;

				if (error instanceof LoginErrors.InvalidCredentialsError) {
					return this.unauthorized(error.message);
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

				return this.clientError(fallbackMessage);
			}

			return this.ok(result.unwrap());
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			return this.fail(message);
		}
	}

	private isValidPayload(body: unknown): body is LoginDTO {
		if (!body || typeof body !== 'object') {
			return false;
		}

		const candidate = body as Partial<LoginDTO>;

		return (
			typeof candidate.email === 'string' && typeof candidate.password === 'string'
		);
	}
}

container.register(LoginController, {
	useFactory: (dependencyContainer) =>
		new LoginController(dependencyContainer.resolve(LoginUseCaseSymbol)),
});
