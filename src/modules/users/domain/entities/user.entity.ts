import type { Result } from '@/core/Result';
import type { UniqueEntityID } from '@/domain/UniqueEntityID';
import { Guard } from '@/core/Guard';
import { Err, Ok } from '@/core/Result';
import { AggregateRoot } from '@/domain/AggregateRoot';

import type { UserEmail } from '../valueObjects/userEmail/userEmail.valueObject';
import type { UserName } from '../valueObjects/userName/userName.valueObject';
import type { UserPassword } from '../valueObjects/userPassword/userPassword.valueObject';
import { UserCreated } from '../events/userCreated.event';
import { UserDeleted } from '../events/userDeleted.event';
import { UserId } from '../valueObjects/userId/userId.valueObject';

interface UserProps {
	email: UserEmail;
	username: UserName;
	password: UserPassword;
	isEmailVerified?: boolean;
	isAdminUser?: boolean;
	isDeleted?: boolean;
	lastLogin?: Date;
}

export class User extends AggregateRoot<UserProps> {
	get userId(): UserId {
		return UserId.create(this._id).unwrap();
	}

	get email(): UserEmail {
		return this.props.email;
	}

	get username(): UserName {
		return this.props.username;
	}

	get password(): UserPassword {
		return this.props.password;
	}

	get isDeleted(): boolean {
		return this.props.isDeleted;
	}

	get isEmailVerified(): boolean {
		return this.props.isEmailVerified;
	}

	get isAdminUser(): boolean {
		return this.props.isAdminUser;
	}

	get lastLogin(): Date {
		return this.props.lastLogin;
	}

	public delete(): void {
		if (!this.props.isDeleted) {
			this.addDomainEvent(new UserDeleted(this));
			this.props.isDeleted = true;
		}
	}

	private constructor(props: UserProps, id?: UniqueEntityID) {
		super(props, id);
	}

	public static create(
		props: UserProps,
		id?: UniqueEntityID,
	): Result<User, string> {
		const guardResult = Guard.againstNullOrUndefinedBulk([
			{ argument: props.username, argumentName: 'username' },
			{ argument: props.email, argumentName: 'email' },
		]);

		if (guardResult.isErr()) {
			return Err(guardResult.unwrapErr());
		}

		const isNewUser = !!id === false;
		const user = new User(
			{
				...props,
				isDeleted: props.isDeleted ? props.isDeleted : false,
				isEmailVerified: props.isEmailVerified ? props.isEmailVerified : false,
				isAdminUser: props.isAdminUser ? props.isAdminUser : false,
			},
			id,
		);

		if (isNewUser) {
			user.addDomainEvent(new UserCreated(user));
		}

		return Ok<User>(user);
	}
}
