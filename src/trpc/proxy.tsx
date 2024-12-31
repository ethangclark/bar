import { createTRPCClient } from "@trpc/client";
import { type AppRouter } from "~/server/api/root";
import { links } from "./links";

export const trpc = createTRPCClient<AppRouter>({ links });
