import type { Result } from '@/core/Result';
import type { UseCase } from '@/core/UseCase';
import type { InjectionToken } from 'tsyringe';
import { AppError } from '@/core/AppError';
import { Err, Ok } from '@/core/Result';
import { container, inject, singleton } from 'tsyringe';

import type { CreateUserDTO } from './createUser.dto';
import type { CreateUserResponse } from './createUser.response';
import { User } from '../../domain/entities/user.entity';
import { UserEmail } from '../../domain/valueObjects/userEmail/userEmail.valueObject';
import { UserName } from '../../domain/valueObjects/userName/userName.valueObject';
import { UserPassword } from '../../domain/valueObjects/userPassword/userPassword.valueObject';
import {
	IUserRepo,
	UserRepoSymbol,
} from '../../repos/interfaces/user/IUserRepo';
import { CreateUserErrors } from './createUser.errors';

export const CreateUserUseCaseSymbol: InjectionToken<CreateUserUseCase> =
	Symbol.for('CreateUserUseCase');

@singleton()
export class CreateUserUseCase implements UseCase<
	CreateUserDTO,
	Promise<CreateUserResponse>
> {
	constructor(@inject(UserRepoSymbol) private userRepo: IUserRepo) {}

	async execute(request: CreateUserDTO): Promise<CreateUserResponse> {
		const emailOrError = UserEmail.create(request.email);
		const passwordOrError = UserPassword.create({ value: request.password });
		const usernameOrError = UserName.create({ name: request.username });

		const firstFailure =
			[emailOrError, passwordOrError, usernameOrError].find((result) =>
				result.isErr(),
			) ?? null;

		if (firstFailure) {
			return Err(firstFailure.unwrapErr());
		}

		const email: UserEmail = emailOrError.unwrap();
		const password: UserPassword = passwordOrError.unwrap();
		const username: UserName = usernameOrError.unwrap();

		try {
			const userAlreadyExists = await this.userRepo.exists(email);

			if (userAlreadyExists.isErr()) {
				return Err(userAlreadyExists.unwrapErr());
			}

			if (userAlreadyExists.unwrap()) {
				return Err(new CreateUserErrors.EmailAlreadyExistsError(email.value));
			}

			try {
				const alreadyCreatedUserByUserName =
					await this.userRepo.getUserByUserName(username);

				if (alreadyCreatedUserByUserName.isOk()) {
					const userNameTaken = !!alreadyCreatedUserByUserName.unwrap() === true;

					if (userNameTaken) {
						return Err(new CreateUserErrors.UsernameTakenError(username.value));
					}
				}
			} catch (err) {
				// ignore user lookup failures for username, handled below
			}

			const userOrError: Result<User, string> = User.create({
				email,
				password,
				username,
			});

			if (userOrError.isErr()) {
				return Err(userOrError.unwrapErr().toString());
			}

			const user: User = userOrError.unwrap();

			const saveResult = await this.userRepo.save(user);

			if (saveResult.isErr()) {
				return Err(saveResult.unwrapErr());
			}

			return Ok<void>(undefined);
		} catch (err) {
			return Err(new AppError.UnexpectedError(err));
		}
	}
}

container.registerSingleton(CreateUserUseCaseSymbol, CreateUserUseCase);
