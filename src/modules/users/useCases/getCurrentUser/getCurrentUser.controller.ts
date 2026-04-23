import type {
	ControllerRequest,
	ControllerResponse,
} from '@/infra/http/interfaces/BaseController';
import { BaseController } from '@/infra/http/interfaces/BaseController';
import { injectable } from 'tsyringe';

import type { JWTPayload } from '../../services/interfaces/auth/auth.service';
import type { GetCurrentUserDTO } from './getCurrentUser.dto';

@injectable()
export class GetCurrentUserController extends BaseController {
	private isJwtPayload(value: unknown): value is JWTPayload {
		if (!value || typeof value !== 'object') {
			return false;
		}

		const candidate = value as Partial<JWTPayload>;

		return (
			typeof candidate.sub === 'string' &&
			typeof candidate.email === 'string' &&
			typeof candidate.username === 'string' &&
			typeof candidate.isAdminUser === 'boolean'
		);
	}

	async executeImpl(
		request: ControllerRequest,
	): Promise<ControllerResponse | Response | void> {
		const userPayload = request.auth?.user;

		if (!this.isJwtPayload(userPayload)) {
			return this.unauthorized('Unauthorized');
		}

		const dto: GetCurrentUserDTO = {
			user: userPayload,
			token: request.auth?.token,
		};

		return this.ok({
			id: dto.user.sub,
			email: dto.user.email,
			username: dto.user.username,
			isAdminUser: dto.user.isAdminUser,
		});
	}
}
