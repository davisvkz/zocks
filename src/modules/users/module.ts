import type { IHttpModule } from '@/infra/http/interfaces/HttpModule';

import './container';

import { userRouter } from './infra/http/implementations/routes/routes';

const identityModule: IHttpModule<typeof userRouter> = {
	basePath: '/users',
	router: userRouter,
};

export default identityModule;
