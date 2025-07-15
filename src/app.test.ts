// src/app.test.ts
import { MainRoutes } from "./presentation/routes";
import { server } from "./presentation/server";
import { envs } from "./configs/envs";

// Usar un puerto aleatorio para testing
const testPort = envs.PORT || 0;
const routes = MainRoutes.getMainRoutes;

// Instanciar el server pero NO llamar a start()
const testServer = new server({
    p_port: testPort,
    p_routes: routes
});

export const app = testServer.app;
