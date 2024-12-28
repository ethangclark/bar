import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { env } from "./env";

const port = parseInt(env.PORT, 10);
const dev = env.NODE_ENV !== "production";
const app = next({
  dev,
  port,
});
const handle = app.getRequestHandler();

void app.prepare().then(() => {
  createServer((req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const parsedUrl = parse(req.url!, true);
    void handle(req, res, parsedUrl);
  }).listen(port);

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`,
  );
});
