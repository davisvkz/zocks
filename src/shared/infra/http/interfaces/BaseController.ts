export interface ControllerRequestAuth {
	user?: unknown;
	token?: string;
}

export interface ControllerRequest {
	body?: unknown;
	auth?: ControllerRequestAuth;
}

export interface ControllerResponse<TBody = unknown> {
	statusCode: number;
	body?: TBody;
}

type ResponseFactory = {
	json: (body: unknown, status: number) => Response;
	newResponse: (body: BodyInit | null, status: number) => Response;
};

const isResponseFactory = (value: unknown): value is ResponseFactory => {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const candidate = value as Partial<ResponseFactory>;

	return (
		typeof candidate.json === 'function' &&
		typeof candidate.newResponse === 'function'
	);
};

const toTransportResponse = (
	factory: ResponseFactory,
	response: ControllerResponse,
): Response => {
	if (response.body === undefined) {
		return factory.newResponse(null, response.statusCode);
	}

	return factory.json(response.body, response.statusCode);
};

export abstract class BaseController<TRequest = ControllerRequest> {
	protected abstract executeImpl(
		request: TRequest,
	): Promise<ControllerResponse | Response | void>;

	public async execute(request: TRequest & ResponseFactory): Promise<Response>;
	public async execute(request: TRequest): Promise<ControllerResponse>;
	public async execute(
		request: TRequest,
	): Promise<ControllerResponse | Response> {
		try {
			const result = await this.executeImpl(request);

			if (result instanceof Response) {
				return result;
			}

			if (result !== undefined) {
				const controllerResponse = result as ControllerResponse;

				if (isResponseFactory(request)) {
					return toTransportResponse(request, controllerResponse);
				}

				return controllerResponse;
			}

			return isResponseFactory(request) ? this.ok(request) : this.ok();
		} catch (err) {
			console.error('[BaseController]: Uncaught controller error');
			console.error(err);
			return isResponseFactory(request)
				? this.fail(request, 'An unexpected error occurred')
				: this.fail('An unexpected error occurred');
		}
	}

	protected jsonResponse(
		code: number,
		message: string,
	): ControllerResponse<{ message: string }>;
	protected jsonResponse(
		request: ResponseFactory,
		code: number,
		message: string,
	): Response;
	protected jsonResponse(
		requestOrCode: ResponseFactory | number,
		codeOrMessage: number | string,
		message?: string,
	): ControllerResponse<{ message: string }> | Response {
		const response = {
			statusCode:
				typeof requestOrCode === 'number' ? requestOrCode : codeOrMessage,
			body: {
				message:
					(typeof requestOrCode === 'number' ? codeOrMessage : message) ?? '',
			},
		} as ControllerResponse<{ message: string }>;

		if (isResponseFactory(requestOrCode)) {
			return toTransportResponse(requestOrCode, response);
		}

		return response;
	}

	public ok<T>(dto?: T): ControllerResponse<T>;
	public ok<T>(request: ResponseFactory, dto?: T): Response;
	public ok<T>(
		requestOrDto?: ResponseFactory | T,
		dto?: T,
	): ControllerResponse<T> | Response {
		const response: ControllerResponse<T> =
			isResponseFactory(requestOrDto) && dto === undefined
				? { statusCode: 200 }
				: {
						statusCode: 200,
						...(isResponseFactory(requestOrDto)
							? dto !== undefined
								? { body: dto }
								: {}
							: requestOrDto !== undefined
								? { body: requestOrDto }
								: {}),
					};

		if (isResponseFactory(requestOrDto)) {
			return toTransportResponse(requestOrDto, response);
		}

		return response;
	}

	public created(): ControllerResponse;
	public created(request: ResponseFactory): Response;
	public created(request?: ResponseFactory): ControllerResponse | Response {
		const response: ControllerResponse = { statusCode: 201 };

		if (request) {
			return toTransportResponse(request, response);
		}

		return response;
	}

	public clientError(message?: string): ControllerResponse<{ message: string }>;
	public clientError(request: ResponseFactory, message?: string): Response;
	public clientError(
		requestOrMessage?: ResponseFactory | string,
		message?: string,
	): ControllerResponse<{ message: string }> | Response {
		if (isResponseFactory(requestOrMessage)) {
			return this.jsonResponse(requestOrMessage, 400, message ?? 'Unauthorized');
		}

		return this.jsonResponse(400, requestOrMessage ?? 'Unauthorized');
	}

	public unauthorized(message?: string): ControllerResponse<{ message: string }>;
	public unauthorized(request: ResponseFactory, message?: string): Response;
	public unauthorized(
		requestOrMessage?: ResponseFactory | string,
		message?: string,
	): ControllerResponse<{ message: string }> | Response {
		if (isResponseFactory(requestOrMessage)) {
			return this.jsonResponse(requestOrMessage, 401, message ?? 'Unauthorized');
		}

		return this.jsonResponse(401, requestOrMessage ?? 'Unauthorized');
	}

	public paymentRequired(
		message?: string,
	): ControllerResponse<{ message: string }>;
	public paymentRequired(request: ResponseFactory, message?: string): Response;
	public paymentRequired(
		requestOrMessage?: ResponseFactory | string,
		message?: string,
	): ControllerResponse<{ message: string }> | Response {
		if (isResponseFactory(requestOrMessage)) {
			return this.jsonResponse(
				requestOrMessage,
				402,
				message ?? 'Payment required',
			);
		}

		return this.jsonResponse(402, requestOrMessage ?? 'Payment required');
	}

	public forbidden(message?: string): ControllerResponse<{ message: string }>;
	public forbidden(request: ResponseFactory, message?: string): Response;
	public forbidden(
		requestOrMessage?: ResponseFactory | string,
		message?: string,
	): ControllerResponse<{ message: string }> | Response {
		if (isResponseFactory(requestOrMessage)) {
			return this.jsonResponse(requestOrMessage, 403, message ?? 'Forbidden');
		}

		return this.jsonResponse(403, requestOrMessage ?? 'Forbidden');
	}

	public notFound(message?: string): ControllerResponse<{ message: string }>;
	public notFound(request: ResponseFactory, message?: string): Response;
	public notFound(
		requestOrMessage?: ResponseFactory | string,
		message?: string,
	): ControllerResponse<{ message: string }> | Response {
		if (isResponseFactory(requestOrMessage)) {
			return this.jsonResponse(requestOrMessage, 404, message ?? 'Not found');
		}

		return this.jsonResponse(404, requestOrMessage ?? 'Not found');
	}

	public conflict(message?: string): ControllerResponse<{ message: string }>;
	public conflict(request: ResponseFactory, message?: string): Response;
	public conflict(
		requestOrMessage?: ResponseFactory | string,
		message?: string,
	): ControllerResponse<{ message: string }> | Response {
		if (isResponseFactory(requestOrMessage)) {
			return this.jsonResponse(requestOrMessage, 409, message ?? 'Conflict');
		}

		return this.jsonResponse(409, requestOrMessage ?? 'Conflict');
	}

	public tooMany(message?: string): ControllerResponse<{ message: string }>;
	public tooMany(request: ResponseFactory, message?: string): Response;
	public tooMany(
		requestOrMessage?: ResponseFactory | string,
		message?: string,
	): ControllerResponse<{ message: string }> | Response {
		if (isResponseFactory(requestOrMessage)) {
			return this.jsonResponse(
				requestOrMessage,
				429,
				message ?? 'Too many requests',
			);
		}

		return this.jsonResponse(429, requestOrMessage ?? 'Too many requests');
	}

	public todo(): ControllerResponse<{ message: string }>;
	public todo(request: ResponseFactory): Response;
	public todo(
		request?: ResponseFactory,
	): ControllerResponse<{ message: string }> | Response {
		if (request) {
			return this.jsonResponse(request, 400, 'TODO');
		}

		return this.jsonResponse(400, 'TODO');
	}

	public fail(error: Error | string): ControllerResponse<{ message: string }>;
	public fail(request: ResponseFactory, error: Error | string): Response;
	public fail(
		requestOrError: ResponseFactory | Error | string,
		error?: Error | string,
	): ControllerResponse<{ message: string }> | Response {
		const actualError = isResponseFactory(requestOrError)
			? error
			: requestOrError;

		console.error(actualError);

		if (isResponseFactory(requestOrError)) {
			return requestOrError.json(
				{
					message: actualError?.toString() ?? '',
				},
				500,
			);
		}

		return {
			statusCode: 500,
			body: {
				message: actualError?.toString() ?? '',
			},
		};
	}
}
