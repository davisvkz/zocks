import type { Result } from '@/core/Result';
import { Err, Ok } from '@/core/Result';
import { Database, DatabaseSymbol } from '@/repo/interfaces/database';
import { container, inject, singleton } from 'tsyringe';

import type { User } from '../../../domain/entities/user.entity';
import type { UserPersistence } from '../../../mappers/user.mapper';
import type { IUserRepo } from '../../interfaces/user/IUserRepo';
import { UserEmail } from '../../../domain/valueObjects/userEmail/userEmail.valueObject';
import { UserName } from '../../../domain/valueObjects/userName/userName.valueObject';
import { UserMapper } from '../../../mappers/user.mapper';
import { UserRepoSymbol } from '../../interfaces/user/IUserRepo';

@singleton()
export class UserRepo implements IUserRepo {
	constructor(@inject(DatabaseSymbol) private readonly database: Database) {}

	async exists(email: UserEmail): Promise<Result<boolean, string>> {
		const user = await this.database.find<UserPersistence>('users', {
			user_email: email.value,
		});

		return Ok<boolean>(!!user);
	}

	async getUserByUserId(id: string): Promise<Result<User, string>> {
		const user = await this.database.find<UserPersistence>('users', {
			base_user_id: id,
		});

		if (!user) {
			return Err('User Not Founded');
		}

		const mappedUserOrError = UserMapper.toDomain(user);
		if (mappedUserOrError.isErr()) {
			return mappedUserOrError;
		}

		return mappedUserOrError;
	}

	async getUserByEmail(
		email: UserEmail | string,
	): Promise<Result<User, string>> {
		const emailValue = email instanceof UserEmail ? email.value : email;

		const user = await this.database.find<UserPersistence>('users', {
			user_email: emailValue,
		});

		if (!user) {
			return Err('no user found');
		}

		const mappedUserOrError = UserMapper.toDomain(user);
		if (mappedUserOrError.isErr()) {
			return mappedUserOrError;
		}

		return mappedUserOrError;
	}

	async getUserByUserName(
		name: UserName | string,
	): Promise<Result<User, string>> {
		const usernameValue = name instanceof UserName ? name.value : name;

		const user = await this.database.find<UserPersistence>('users', {
			username: usernameValue,
		});

		if (!user) {
			return Err('no user found');
		}

		const mappedUserOrError = UserMapper.toDomain(user);
		if (mappedUserOrError.isErr()) {
			return mappedUserOrError;
		}

		return mappedUserOrError;
	}

	async save(user: User): Promise<Result<void, string>> {
		const mappedUserOrError = UserMapper.toPersistence(user);
		if (mappedUserOrError.isErr()) {
			return Err('Error on converting to Persistence');
		}

		await this.database.insert('users', mappedUserOrError.unwrap());

		return Ok<void>(undefined);
	}
}

container.registerSingleton(UserRepoSymbol, UserRepo);
