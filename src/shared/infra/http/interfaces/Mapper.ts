import type { Result } from '@/core/Result';

export abstract class Mapper<Entity, Persistence, DTO> {
	abstract toDTO(domain: Entity): Result<DTO, unknown>;
	abstract toDomain(raw: unknown): Result<Entity, unknown>;
	abstract toPersistence(domain: Entity): Result<Persistence, unknown>;
}
