import type { ControllerResponse } from '@/infra/http/interfaces/BaseController';
import type {
	Response as ExpressResponse,
	NextFunction,
	Request,
} from 'express';
import { json, Router } from 'express';
import { container } from 'tsyringe';

import type {
	AuthMiddlewareResponse,
	AuthResponseLocals,
	IAuthMiddleware,
} from '../../interfaces/auth/auth.middleware';
import { CreateUserController } from '../../../../useCases/createUser/createUser.controller';
import { GetCurrentUserController } from '../../../../useCases/getCurrentUser/getCurrentUser.controller';
import { LoginController } from '../../../../useCases/login/login.controller';
import { AuthMiddlewareSymbol } from '../../interfaces/auth/auth.middleware';

const userRouter: Router = Router();

const authMiddleware = container.resolve<IAuthMiddleware>(AuthMiddlewareSymbol);
const jsonBodyParser = json();

type UsersResponse = ExpressResponse<unknown, AuthResponseLocals>;

const sendControllerResult = async (
	res: UsersResponse,
	result: ControllerResponse | Response,
): Promise<void> => {
	if (result instanceof Response) {
		const contentType = result.headers.get('content-type');
		const body = await result.text();

		if (contentType) {
			res.type(contentType);
		}

		res.status(result.status).send(body);
		return;
	}

	if (result.body === undefined) {
		res.status(result.statusCode).send();
		return;
	}

	res.status(result.statusCode).json(result.body);
};

const ensureAuthenticated = async (
	req: Request,
	res: UsersResponse,
	next: NextFunction,
): Promise<void> => {
	const authResponse: AuthMiddlewareResponse = {
		locals: res.locals,
		status(code) {
			res.status(code);
			return authResponse;
		},
		json(body) {
			res.json(body);
		},
	};

	await authMiddleware.ensureAuthenticated()(req, authResponse, async () => {
		next();
	});
};

const executeJsonController =
	<
		TController extends {
			execute: (request: {
				body: unknown;
			}) => Promise<ControllerResponse | Response>;
		},
	>(
		resolveController: () => TController,
	) =>
	async (req: Request, res: UsersResponse): Promise<void> => {
		const result = await resolveController().execute({
			body: req.body,
		});

		await sendControllerResult(res, result);
	};

userRouter.post(
	'/auth/login',
	jsonBodyParser,
	executeJsonController(() => container.resolve(LoginController)),
);

userRouter.get(
	'/me',
	ensureAuthenticated,
	async (_req: Request, res: UsersResponse): Promise<void> => {
		const result = await container.resolve(GetCurrentUserController).execute({
			auth: res.locals.auth,
		});

		await sendControllerResult(res, result);
	},
);

userRouter.post(
	'/post',
	jsonBodyParser,
	executeJsonController(() => container.resolve(CreateUserController)),
);

userRouter.use(
	(
		error: unknown,
		_req: Request,
		res: UsersResponse,
		next: NextFunction,
	): void => {
		if (
			error instanceof SyntaxError &&
			typeof error === 'object' &&
			error !== null &&
			'body' in error
		) {
			res.status(500).json({
				message: 'An unexpected error occurred',
			});
			return;
		}

		next(error);
	},
);

userRouter.use((_req: Request, res: UsersResponse) => {
	res.status(404).send('404 Not Found');
});

export { userRouter };
