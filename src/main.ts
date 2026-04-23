import type { IHttpModule } from '@modules/shared/infra/http/interfaces/HttpModule';

import 'reflect-metadata';

import { serve } from '@hono/node-server';
import { ConfigEnvSymbol } from '@modules/shared/config/env';
import { Hono } from 'hono';

import '@/container';

import { container } from 'tsyringe';

const MainRouter = new Hono();

export const modules: Array<
	IHttpModule<Parameters<typeof MainRouter.route>[1]>
> = [];

const _config = container.resolve(ConfigEnvSymbol);

modules.forEach((m) => {
	MainRouter.route(m.basePath, m.router);
});

serve(MainRouter);
