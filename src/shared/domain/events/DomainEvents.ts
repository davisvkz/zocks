import type { AggregateRoot } from '../AggregateRoot';
import type { UniqueEntityID } from '../UniqueEntityID';
import type { IDomainEvent } from './IDomainEvent';

export class DomainEvents {
	private static handlersMap: Record<
		string,
		Array<(event: IDomainEvent) => void>
	> = {};
	private static markedAggregates: Array<AggregateRoot<unknown>> = [];

	/**
	 * @method markAggregateForDispatch
	 * @static
	 * @desc Called by aggregate root objects that have created domain
	 * events to eventually be dispatched when the infrastructure commits
	 * the unit of work.
	 */

	public static markAggregateForDispatch(
		aggregate: AggregateRoot<unknown>,
	): void {
		const aggregateFound = !!this.findMarkedAggregateByID(aggregate.id);

		if (!aggregateFound) {
			this.markedAggregates.push(aggregate);
		}
	}

	private static dispatchAggregateEvents(
		aggregate: AggregateRoot<unknown>,
	): void {
		aggregate.domainEvents.forEach((event: IDomainEvent) => this.dispatch(event));
	}

	private static removeAggregateFromMarkedDispatchList(
		aggregate: AggregateRoot<unknown>,
	): void {
		const index = this.markedAggregates.findIndex((a) => a.equals(aggregate));
		this.markedAggregates.splice(index, 1);
	}

	private static findMarkedAggregateByID(
		id: UniqueEntityID,
	): AggregateRoot<unknown> | undefined {
		return this.markedAggregates.find((aggregate) => aggregate.id.equals(id));
	}

	public static dispatchEventsForAggregate(id: UniqueEntityID): void {
		const aggregate = this.findMarkedAggregateByID(id);

		if (!aggregate) {
			return;
		}

		this.dispatchAggregateEvents(aggregate);
		aggregate.clearEvents();
		this.removeAggregateFromMarkedDispatchList(aggregate);
	}

	public static register(
		callback: (event: IDomainEvent) => void,
		eventClassName: string,
	): void {
		if (!Object.prototype.hasOwnProperty.call(this.handlersMap, eventClassName)) {
			this.handlersMap[eventClassName] = [];
		}
		this.handlersMap[eventClassName].push(callback);
	}

	public static clearHandlers(): void {
		this.handlersMap = {};
	}

	public static clearMarkedAggregates(): void {
		this.markedAggregates = [];
	}

	private static dispatch(event: IDomainEvent): void {
		const eventClassName: string = event.constructor.name;

		if (!Object.prototype.hasOwnProperty.call(this.handlersMap, eventClassName)) {
			return;
		}

		const handlers = this.handlersMap[eventClassName] ?? [];

		for (const handler of handlers) {
			handler(event);
		}
	}
}
