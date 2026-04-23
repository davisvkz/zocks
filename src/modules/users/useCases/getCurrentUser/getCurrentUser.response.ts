import type { UnexpectedError } from '@/core/AppError';
import type { Result } from '@/core/Result';

export type GetCurrentUserData = {
	id: string;
	email: string;
	username: string;
	isAdminUser: boolean;
};

export type GetCurrentUserResponse = Result<
	GetCurrentUserData,
	UnexpectedError | string
>;
