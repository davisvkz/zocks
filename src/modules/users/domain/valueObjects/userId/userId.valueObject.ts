import type { Result } from '@/core/Result';
import type { UniqueEntityID } from '@/domain/UniqueEntityID';
import { Guard } from '@/core/Guard';
import { Err, Ok } from '@/core/Result';
import { ValueObject } from '@/domain/ValueObject';

export class UserId extends ValueObject<{ value: UniqueEntityID }> {
	getStringValue(): string {
		return this.props.value.toString();
	}

	getValue(): UniqueEntityID {
		return this.props.value;
	}

	private constructor(value: UniqueEntityID) {
		super({ value });
	}

	public static create(value: UniqueEntityID): Result<UserId, string> {
		const guardResult = Guard.againstNullOrUndefined(value, 'value');
		if (guardResult.isErr()) {
			return Err(guardResult.unwrapErr());
		}
		return Ok<UserId>(new UserId(value));
	}
}
