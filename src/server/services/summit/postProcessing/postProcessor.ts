import { eq } from "drizzle-orm";
import { invoke } from "~/common/fnUtils";
import { db, schema, type DbOrTx } from "~/server/db";
import { publishDescendentDeletions } from "~/server/db/pubsub/descendentPubSub";
import { type Message, type MessageWithDescendents } from "~/server/db/schema";
import { enrichResponse } from "./enrichResponse";
import { wrapUpResponse } from "./wrapUpResponse";

import { getErrorScore } from "../errorScoring/errorScore";
type Winner = {
  response: Message;
  enrichments: Awaited<ReturnType<typeof enrichResponse>>;
  errorScore: number;
};

export type RetryHistory = {
  prevResponseAttempts: Message[];
  prevBest: Winner;
};

const maxAttempts = 3;

async function deleteBadAttempt(message: Message, tx: DbOrTx) {
  await tx.delete(schema.messages).where(eq(schema.messages.id, message.id));
  await publishDescendentDeletions({
    messages: [message],
  });
}

export async function postProcess(
  currentResponse: Message,
  prevMessages: MessageWithDescendents[],
  retryHistory: RetryHistory | null,
  threadTokenLength: number,
) {
  const enrichments = await enrichResponse(currentResponse, prevMessages);

  const errorScore = await getErrorScore({
    baseMessage: currentResponse,
    mediaInjections: enrichments.mediaInjections,
  });

  const winner = await invoke(async (): Promise<Winner> => {
    if (retryHistory && errorScore > retryHistory.prevBest.errorScore) {
      await deleteBadAttempt(currentResponse, db);
      return retryHistory.prevBest;
    }
    if (retryHistory) {
      await deleteBadAttempt(retryHistory.prevBest.response, db);
    }
    return {
      response: currentResponse,
      enrichments,
      errorScore,
    };
  });

  const wasFinalAttempt =
    retryHistory?.prevResponseAttempts.length === maxAttempts - 1;

  if (errorScore === 0 || wasFinalAttempt) {
    await wrapUpResponse({
      assistantResponse: winner.response,
      hasViewPieces: winner.enrichments.hasViewPieces,
      completedActivityThisTurn: winner.enrichments.completedActivityThisTurn,
      threadTokenLength,
      tx: db,
    });
    return {
      needsRetry: false,
      retryHistory: null,
    };
  }

  return {
    needsRetry: true,
    retryHistory: {
      prevResponseAttempts: [
        ...(retryHistory?.prevResponseAttempts ?? []),
        currentResponse,
      ],
      prevBest: winner,
    },
  };
}
