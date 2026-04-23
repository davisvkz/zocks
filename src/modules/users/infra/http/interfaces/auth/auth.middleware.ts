import type { InjectionToken } from 'tsyringe';

import type { JWTPayload } from '../../../../../users/services/interfaces/auth/auth.service';

export type AuthState = {
	user: JWTPayload;
	token: string;
};

export type AuthResponseLocals = {
	auth?: AuthState;
};

export type AuthMiddlewareRequest = {
	headers: {
		authorization?: string | string[];
	};
};

export type AuthMiddlewareResponse = {
	locals: AuthResponseLocals;
	status: (code: 401 | 403) => AuthMiddlewareResponse;
	json: (body: { message: string }) => Response | void;
};

export type AuthMiddlewareNext = () => void | Promise<void>;

export type AuthMiddlewareHandler = (
	req: AuthMiddlewareRequest,
	res: AuthMiddlewareResponse,
	next: AuthMiddlewareNext,
) => Promise<Response | void>;

export interface IAuthMiddleware {
	includeDecodedTokenIfExists(): AuthMiddlewareHandler;
	ensureAuthenticated(): AuthMiddlewareHandler;
}

export const AuthMiddlewareSymbol: InjectionToken<IAuthMiddleware> =
	Symbol.for('AuthMiddleware');
