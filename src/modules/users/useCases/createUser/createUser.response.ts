import type { UnexpectedError } from '@/core/AppError';
import type { Result } from '@/core/Result';

import type {
	EmailAlreadyExistsError,
	UsernameTakenError,
} from './createUser.errors';

export type CreateUserResponse = Result<
	void,
	EmailAlreadyExistsError | UsernameTakenError | UnexpectedError | string
>;
