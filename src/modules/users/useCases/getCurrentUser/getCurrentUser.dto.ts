import type { JWTPayload } from '../../services/interfaces/auth/auth.service';

export interface GetCurrentUserDTO {
	user: JWTPayload;
	token?: string;
}
