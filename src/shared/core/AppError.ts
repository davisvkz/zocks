import { UseCaseError } from './UseCaseError';

export class UnexpectedError extends UseCaseError {
	public readonly error: unknown;

	public constructor(err: unknown) {
		super('An unexpected error occurred.');
		this.error = err;
		console.log(`[AppError]: An unexpected error occurred`);
		console.error(err);
	}

	public static create(err: unknown): UnexpectedError {
		return new UnexpectedError(err);
	}
}

export const AppError = {
	UnexpectedError,
};
