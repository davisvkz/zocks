import type { Hono } from 'hono';
import type { BlankSchema } from 'hono/types';

export interface IModule<TEnv = unknown> {
	basePath: string;
	route: Hono<TEnv, BlankSchema, '/'>;
}
