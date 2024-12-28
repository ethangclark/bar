import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { env } from "./env";
import ws from "ws";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { appRouter } from "./server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const port = parseInt(env.PORT, 10);
const dev = env.NODE_ENV !== "production";
const app = next({
  dev,
  port,
});
const handle = app.getRequestHandler();

void app.prepare().then(() => {
  const server = createServer((req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const parsedUrl = parse(req.url!, true);
    void handle(req, res, parsedUrl);
  });

  const wss = new ws.Server({ server });

  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createContext: createTRPCContext as any,
    // Enable heartbeat messages to keep connection open (disabled by default)
    keepAlive: {
      enabled: true,
      // server ping message interval in milliseconds
      pingMs: 30000,
      // connection is terminated if pong message is not received in this many milliseconds
      pongWaitMs: 5000,
    },
  });

  wss.on("connection", (ws) => {
    console.log(`➕➕ Connection (${wss.clients.size})`);
    ws.once("close", () => {
      console.log(`➖➖ Connection (${wss.clients.size})`);
    });
  });
  console.log("✅ WebSocket Server listening on ws://localhost:3001");
  process.on("SIGTERM", () => {
    console.log("SIGTERM");
    handler.broadcastReconnectNotification();
    wss.close();
  });

  server.listen(port);

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : env.NODE_ENV
    }`,
  );
});
