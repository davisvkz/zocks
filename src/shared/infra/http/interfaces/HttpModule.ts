export interface IHttpModule<TRouter = unknown> {
	basePath: string;
	router: TRouter;
}
