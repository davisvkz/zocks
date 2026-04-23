import type { Result } from '@/core/Result';
import { Guard } from '@/core/Guard';
import { Err, Ok } from '@/core/Result';
import { ValueObject } from '@/domain/ValueObject';

interface UserNameProps {
	name: string;
}

export class UserName extends ValueObject<UserNameProps> {
	public static maxLength: number = 15;
	public static minLength: number = 2;

	get value(): string {
		return this.props.name;
	}

	private constructor(props: UserNameProps) {
		super(props);
	}

	public static create(props: UserNameProps): Result<UserName, string> {
		const usernameResult = Guard.againstNullOrUndefined(props.name, 'username');
		if (usernameResult.isErr()) {
			return Err(usernameResult.unwrapErr());
		}

		const minLengthResult = Guard.againstAtLeast(this.minLength, props.name);
		if (minLengthResult.isErr()) {
			return Err(minLengthResult.unwrapErr());
		}

		const maxLengthResult = Guard.againstAtMost(this.maxLength, props.name);
		if (maxLengthResult.isErr()) {
			return Err(maxLengthResult.unwrapErr());
		}

		return Ok<UserName>(new UserName(props));
	}
}
