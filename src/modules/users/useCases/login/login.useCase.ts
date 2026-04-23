import type { Result } from '@/core/Result';
import type { UseCase } from '@/core/UseCase';
import type { InjectionToken } from 'tsyringe';
import { AppError } from '@/core/AppError';
import { Err, Ok } from '@/core/Result';
import { container, inject, singleton } from 'tsyringe';

import type { User } from '../../domain/entities/user.entity';
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { IAuthService } from '../../services/interfaces/auth/auth.service';
import type { LoginDTO } from './login.dto';
import type { LoginResponse } from './login.response';
import { UserEmail } from '../../domain/valueObjects/userEmail/userEmail.valueObject';
import {
	IUserRepo,
	UserRepoSymbol,
} from '../../repos/interfaces/user/IUserRepo';
import { AuthServiceSymbol } from '../../services/interfaces/auth/auth.service';
import { LoginErrors } from './login.errors';

export const LoginUseCaseSymbol: InjectionToken<LoginUseCase> =
	Symbol.for('LoginUseCase');

@singleton()
export class LoginUseCase implements UseCase<LoginDTO, Promise<LoginResponse>> {
	constructor(
		@inject(UserRepoSymbol) private userRepo: IUserRepo,
		@inject(AuthServiceSymbol) private authService: IAuthService,
	) {}

	async execute(request: LoginDTO): Promise<LoginResponse> {
		const emailOrError = UserEmail.create(request.email);

		if (emailOrError.isErr()) {
			return Err(emailOrError.unwrapErr());
		}

		const email = emailOrError.unwrap();

		try {
			const userOrError: Result<User, string> =
				await this.userRepo.getUserByEmail(email);

			if (userOrError.isErr()) {
				return Err(new LoginErrors.InvalidCredentialsError());
			}

			const user = userOrError.unwrap();

			if (user.isDeleted) {
				return Err(new LoginErrors.InvalidCredentialsError());
			}

			const isPasswordValid = user.password.comparePassword(request.password);

			if (!isPasswordValid) {
				return Err(new LoginErrors.InvalidCredentialsError());
			}

			const tokens = await this.authService.generateTokens({
				sub: user.userId.getStringValue(),
				email: user.email.value,
				username: user.username.value,
				isAdminUser: user.isAdminUser,
			});

			return Ok(tokens);
		} catch (err) {
			return Err(new AppError.UnexpectedError(err));
		}
	}
}

container.registerSingleton(LoginUseCaseSymbol, LoginUseCase);
