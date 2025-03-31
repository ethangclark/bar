import { type Message } from "~/server/db/schema";
import { type ViewPieceInjection } from "../types";

export type ErrorScoreParams = {
  baseMessage: Message;
  mediaInjections: ViewPieceInjection[];
};
