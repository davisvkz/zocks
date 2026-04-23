import type { IDomainEvent } from './IDomainEvent';

export interface IHandle<T extends IDomainEvent> {
	setupSubscriptions(): void;
	handle(event: T): void;
}
