import type { Result } from '@/core/Result';
import { Guard } from '@/core/Guard';
import { Err, Ok } from '@/core/Result';
import { ValueObject } from '@/domain/ValueObject';
import * as bcrypt from 'bcrypt';

export interface IUserPasswordProps {
	value: string;
	hashed?: boolean;
}

export class UserPassword extends ValueObject<IUserPasswordProps> {
	public static minLength: number = 6;
	private static readonly SALT_ROUNDS = 10;

	get value(): string {
		return this.props.value;
	}

	private constructor(props: IUserPasswordProps) {
		super(props);
	}

	private static isAppropriateLength(password: string): boolean {
		return password.length >= this.minLength;
	}

	public comparePassword(plainTextPassword: string): boolean {
		let hashed: string;
		if (this.isAlreadyHashed()) {
			hashed = this.props.value;
			return this.bcryptCompare(plainTextPassword, hashed);
		} else {
			return this.props.value === plainTextPassword;
		}
	}

	private bcryptCompare(plainText: string, hashed: string): boolean {
		return bcrypt.compareSync(plainText, hashed);
	}

	public isAlreadyHashed(): boolean {
		return this.props.hashed;
	}

	private hashPassword(password: string): string {
		return bcrypt.hashSync(password, UserPassword.SALT_ROUNDS);
	}

	public getHashedValue(): string {
		if (this.isAlreadyHashed()) {
			return this.props.value;
		} else {
			return this.hashPassword(this.props.value);
		}
	}

	public static create(props: IUserPasswordProps): Result<UserPassword, string> {
		const propsResult = Guard.againstNullOrUndefined(props.value, 'password');

		if (propsResult.isErr()) {
			return Err(propsResult.unwrapErr());
		} else {
			if (!props.hashed) {
				if (!this.isAppropriateLength(props.value)) {
					return Err('Password doesnt meet criteria [8 chars min].');
				}
			}

			return Ok<UserPassword>(
				new UserPassword({
					value: props.value,
					hashed: !!props.hashed === true,
				}),
			);
		}
	}
}
