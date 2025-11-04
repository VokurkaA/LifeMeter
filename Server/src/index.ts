import { router } from "./routes/index.route";
import { app, startServer } from "./server";

app.route("/api", router);

startServer();