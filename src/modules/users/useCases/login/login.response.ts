import type { UnexpectedError } from '@/core/AppError';
import type { Result } from '@/core/Result';

import type { AuthTokens } from '../../services/interfaces/auth/auth.service';
import type { InvalidCredentialsError } from './login.errors';

export type LoginResponse = Result<
	AuthTokens,
	InvalidCredentialsError | UnexpectedError | string
>;
