import type { IDomainEvent } from '@modules/shared/domain/events/IDomainEvent';
import type { UniqueEntityID } from '@modules/shared/domain/UniqueEntityID';

import type { User } from '../entities/user.entity';

export class UserLoggedIn implements IDomainEvent {
	public dateTimeOccurred: Date;
	public user: User;

	constructor(user: User) {
		this.dateTimeOccurred = new Date();
		this.user = user;
	}

	public getAggregateId(): UniqueEntityID {
		return this.user.id;
	}
}
