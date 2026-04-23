import { UseCaseError } from '@/core/UseCaseError';

export class EmailAlreadyExistsError extends UseCaseError {
	constructor(email: string) {
		super(`The email ${email} associated for this account already exists`);
	}
}

export class UsernameTakenError extends UseCaseError {
	constructor(username: string) {
		super(`The username ${username} was already taken`);
	}
}

export const CreateUserErrors = {
	EmailAlreadyExistsError,
	UsernameTakenError,
};
