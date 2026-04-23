import type { Result } from '@/core/Result';
import type { InjectionToken } from 'tsyringe';

export interface JWTPayload {
	sub: string;
	email: string;
	username: string;
	isAdminUser: boolean;
}

export interface AuthTokens {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: string;
	refreshTokenExpiresIn: string;
}

export interface IAuthService {
	generateTokens(payload: JWTPayload): Promise<AuthTokens>;
	verifyAccessToken(token: string): Promise<Result<JWTPayload, string>>;
	verifyRefreshToken(token: string): Promise<Result<JWTPayload, string>>;
}

export const AuthServiceSymbol: InjectionToken<IAuthService> =
	Symbol.for('AuthService');
