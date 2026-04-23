import type { UniqueEntityID } from '../UniqueEntityID';

export interface IDomainEvent {
	dateTimeOccurred: Date;
	getAggregateId(): UniqueEntityID;
}
