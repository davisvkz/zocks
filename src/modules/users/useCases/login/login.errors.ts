import { UseCaseError } from '@/core/UseCaseError';

export class InvalidCredentialsError extends UseCaseError {
	constructor() {
		super('Email ou senha inválidos');
	}
}

export const LoginErrors = {
	InvalidCredentialsError,
};
