import {router} from "./routes/index.route.js";
import {app, startServer} from "./server.js";

app.route("/api", router);

startServer();