import type { Result } from '@/core/Result';
import type { InjectionToken } from 'tsyringe';

import type { User } from '../../../domain/entities/user.entity';
import type { UserEmail } from '../../../domain/valueObjects/userEmail/userEmail.valueObject';
import type { UserName } from '../../../domain/valueObjects/userName/userName.valueObject';

export interface IUserRepo {
	exists(userEmail: UserEmail): Promise<Result<boolean, string>>;
	getUserByUserId(userId: string): Promise<Result<User, string>>;
	getUserByEmail(userEmail: UserEmail | string): Promise<Result<User, string>>;
	getUserByUserName(userName: UserName | string): Promise<Result<User, string>>;
	save(user: User): Promise<Result<void, string>>;
}

export const UserRepoSymbol: InjectionToken<IUserRepo> = Symbol.for('UserRepo');
