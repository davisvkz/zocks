import type { Result } from './Result';
import { Err, Ok } from './Result';

export type GuardResponse = string;

export interface IGuardArgument {
	argument: unknown;
	argumentName: string;
}

export type GuardArgumentCollection = IGuardArgument[];

export class Guard {
	public static combine(
		guardResults: Result<unknown, GuardResponse>[],
	): Result<void, GuardResponse> {
		for (const result of guardResults) {
			if (result.isErr()) return result as Result<void, GuardResponse>;
		}

		return Ok<void>(undefined);
	}

	public static greaterThan(
		minValue: number,
		actualValue: number,
	): Result<void, GuardResponse> {
		return actualValue > minValue
			? Ok<void>(undefined)
			: Err(`Number given {${actualValue}} is not greater than {${minValue}}`);
	}

	public static againstAtLeast(
		numChars: number,
		text: string,
	): Result<void, GuardResponse> {
		return text.length >= numChars
			? Ok<void>(undefined)
			: Err(`Text is not at least ${numChars} chars.`);
	}

	public static againstAtMost(
		numChars: number,
		text: string,
	): Result<void, GuardResponse> {
		return text.length <= numChars
			? Ok<void>(undefined)
			: Err(`Text is greater than ${numChars} chars.`);
	}

	public static againstNullOrUndefined(
		argument: unknown,
		argumentName: string,
	): Result<void, GuardResponse> {
		if (argument === null || argument === undefined) {
			return Err(`${argumentName} is null or undefined`);
		} else {
			return Ok<void>(undefined);
		}
	}

	public static againstNullOrUndefinedBulk(
		args: GuardArgumentCollection,
	): Result<void, GuardResponse> {
		for (const arg of args) {
			const result = this.againstNullOrUndefined(arg.argument, arg.argumentName);
			if (result.isErr()) return result;
		}

		return Ok<void>(undefined);
	}

	public static isOneOf(
		value: unknown,
		validValues: unknown[],
		argumentName: string,
	): Result<void, GuardResponse> {
		let isValid = false;
		for (const validValue of validValues) {
			if (value === validValue) {
				isValid = true;
			}
		}

		if (isValid) {
			return Ok<void>(undefined);
		} else {
			const formattedValue =
				typeof value === 'object' ? JSON.stringify(value) : String(value);
			return Err(
				`${argumentName} isn't oneOf the correct types in ${JSON.stringify(validValues)}. Got "${formattedValue}".`,
			);
		}
	}

	public static inRange(
		num: number,
		min: number,
		max: number,
		argumentName: string,
	): Result<void, GuardResponse> {
		const isInRange = num >= min && num <= max;
		if (!isInRange) {
			return Err(`${argumentName} is not within range ${min} to ${max}.`);
		} else {
			return Ok<void>(undefined);
		}
	}

	public static allInRange(
		numbers: number[],
		min: number,
		max: number,
		argumentName: string,
	): Result<void, GuardResponse> {
		let failingResult: Result<void, GuardResponse> | null = null;

		for (const num of numbers) {
			const numIsInRangeResult = this.inRange(num, min, max, argumentName);
			if (numIsInRangeResult.isErr()) {
				failingResult = numIsInRangeResult;
				break;
			}
		}

		if (failingResult) {
			return Err(`${argumentName} is not within the range.`);
		} else {
			return Ok<void>(undefined);
		}
	}
}
