import { container } from 'tsyringe';

import type { IAuthService } from '../../../../services/interfaces/auth/auth.service';
import type {
	AuthMiddlewareHandler,
	AuthMiddlewareRequest,
	AuthMiddlewareResponse,
	AuthState,
	IAuthMiddleware,
} from '../../interfaces/auth/auth.middleware';
import { AuthServiceSymbol } from '../../../../services/interfaces/auth/auth.service';
import { AuthMiddlewareSymbol } from '../../interfaces/auth/auth.middleware';

export class AuthMiddleware implements IAuthMiddleware {
	constructor(private readonly authService: IAuthService) {}

	private respond(
		res: AuthMiddlewareResponse,
		status: 401 | 403,
		message: string,
	): Response | void {
		return res.status(status).json({ message });
	}

	private extractToken(req: AuthMiddlewareRequest): string | null {
		const authorization = req.headers.authorization;
		const header = Array.isArray(authorization)
			? authorization[0]
			: authorization;

		if (!header) {
			return null;
		}

		const [scheme, token] = header.split(' ');

		if (token && /^Bearer$/i.test(scheme)) {
			return token;
		}

		return header;
	}

	private async attachIfValidToken(
		res: AuthMiddlewareResponse,
		token: string,
	): Promise<{ success: boolean; payload?: AuthState['user'] }> {
		const verification = await this.authService.verifyAccessToken(token);

		if (verification.isErr()) {
			return { success: false };
		}

		const payload = verification.unwrap();

		res.locals.auth = {
			user: payload,
			token,
		};

		return { success: true, payload };
	}

	includeDecodedTokenIfExists(): AuthMiddlewareHandler {
		return async (req, res, next) => {
			const token = this.extractToken(req);

			if (token) {
				await this.attachIfValidToken(res, token);
			}

			await next();
		};
	}

	ensureAuthenticated(): AuthMiddlewareHandler {
		return async (req, res, next) => {
			const token = this.extractToken(req);

			if (!token) {
				return this.respond(res, 401, 'No access token provided');
			}

			const verification = await this.attachIfValidToken(res, token);

			if (!verification.success) {
				return this.respond(res, 403, 'Token expired or invalid');
			}

			await next();
		};
	}
}

container.register(AuthMiddlewareSymbol, {
	useFactory: (dependencyContainer) =>
		new AuthMiddleware(dependencyContainer.resolve(AuthServiceSymbol)),
});
