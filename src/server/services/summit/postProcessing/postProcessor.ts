import { eq } from "drizzle-orm";
import { invoke } from "~/common/fnUtils";
import { db, schema, type DbOrTx } from "~/server/db";
import { publishDescendentDeletions } from "~/server/db/pubsub/descendentPubSub";
import { type Message, type MessageWithDescendents } from "~/server/db/schema";
import { type MediaInjectionData } from "../mediaInjection/mediaInjectionParser";
import { enrichResponse } from "./enrichResponse";
import { wrapUpResponse } from "./wrapUpResponse";

type Winner = {
  response: Message;
  enrichments: Awaited<ReturnType<typeof enrichResponse>>;
  errorScore: number;
};

export type RetryHistory = {
  prevResponseAttempts: Message[];
  prevBest: Winner;
};

let prev = 0;

async function getErrorScore(
  responseMessage: Message,
  mediaInjectionData: MediaInjectionData | null,
) {
  if (prev === 0) {
    prev = 0.3;
    return prev;
  } else if (prev === 0.3) {
    prev = 0.6;
    return prev;
  } else if (prev === 0.6) {
    prev = 0;
    return prev;
  }
  return prev;
}

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

  const errorScore = await getErrorScore(
    currentResponse,
    enrichments.mediaInjectionData,
  );

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
