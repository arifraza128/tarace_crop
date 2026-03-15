import serverless from "serverless-http";
import app from "../../artifacts/api-server/src/app.ts";

export const handler = serverless(app, {
	basePath: "/.netlify/functions/api",
});
