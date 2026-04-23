import type { Result } from '@/core/Result';
import type { Mapper } from '@/infra/http/interfaces/Mapper';
import { Err, Ok } from '@/core/Result';
import { UniqueEntityID } from '@/domain/UniqueEntityID';

import type { UserDTO } from '../dtos/user.dto';
import { User } from '../domain/entities/user.entity';
import { UserEmail } from '../domain/valueObjects/userEmail/userEmail.valueObject';
import { UserName } from '../domain/valueObjects/userName/userName.valueObject';
import { UserPassword } from '../domain/valueObjects/userPassword/userPassword.valueObject';

export type UserPersistence = {
	base_user_id: string;
	user_email: string;
	is_email_verified: boolean;
	username: string;
	user_password: string | null;
	is_admin_user: boolean;
	is_deleted: boolean;
};

class UserMapper implements Mapper<User, UserPersistence, UserDTO> {
	public toDTO(user: User): Result<UserDTO, string> {
		return Ok({
			username: user.username.value,
			isEmailVerified: user.isEmailVerified,
			isAdminUser: user.isAdminUser,
			isDeleted: user.isDeleted,
		});
	}

	public toDomain(raw: UserPersistence): Result<User, string> {
		const userNameOrError = UserName.create({ name: raw.username });
		const userPasswordOrError = UserPassword.create({
			value: raw.user_password,
			hashed: true,
		});
		const userEmailOrError = UserEmail.create(raw.user_email);

		const firstError =
			[userNameOrError, userPasswordOrError, userEmailOrError].find((result) =>
				result.isErr(),
			) ?? null;

		if (firstError) {
			return Err(firstError.unwrapErr());
		}

		const user = User.create(
			{
				username: userNameOrError.unwrap(),
				isAdminUser: raw.is_admin_user,
				isDeleted: raw.is_deleted,
				isEmailVerified: raw.is_email_verified,
				password: userPasswordOrError.unwrap(),
				email: userEmailOrError.unwrap(),
			},
			new UniqueEntityID(raw.base_user_id),
		);

		return user;
	}

	public toPersistence(user: User): Result<UserPersistence, string> {
		let password: string | null = null;
		if (!!user.password === true) {
			if (user.password.isAlreadyHashed()) {
				password = user.password.value;
			} else {
				password = user.password.getHashedValue();
			}
		}

		return Ok<UserPersistence>({
			base_user_id: user.userId.getStringValue(),
			user_email: user.email.value,
			is_email_verified: user.isEmailVerified,
			username: user.username.value,
			user_password: password,
			is_admin_user: user.isAdminUser,
			is_deleted: user.isDeleted,
		});
	}
}

const userMapper = new UserMapper();
export { userMapper as UserMapper };
