import { eq } from "drizzle-orm";
import { invoke } from "~/common/fnUtils";
import { db, schema, type DbOrTx } from "~/server/db";
import { publishDescendentDeletions } from "~/server/db/pubsub/descendentPubSub";
import { type Message, type MessageWithDescendents } from "~/server/db/schema";
import { type MediaInjectionData } from "../mediaInjection/mediaInjectionParser";
import { enrichResponse } from "./enrichResponse";
import { wrapUpResponse } from "./wrapUpResponse";

export type RetryHistory = {
  prevResponseAttempts: Message[];
  prevBest: {
    response: Message;
    errorScore: number;
  };
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
  assistantResponse: Message,
  prevMessages: MessageWithDescendents[],
  retryHistory: RetryHistory | null,
  threadTokenLength: number,
) {
  const { hasViewPieces, completedActivityThisTurn, mediaInjectionData } =
    await enrichResponse(assistantResponse, prevMessages);

  const errorScore = await getErrorScore(assistantResponse, mediaInjectionData);

  if (retryHistory && errorScore < retryHistory.prevBest.errorScore) {
    await deleteBadAttempt(retryHistory.prevBest.response, db);
  }

  const wasFinalAttempt =
    retryHistory?.prevResponseAttempts.length === maxAttempts - 1;

  if (errorScore === 0 || wasFinalAttempt) {
    await wrapUpResponse({
      assistantResponse,
      hasViewPieces,
      completedActivityThisTurn,
      threadTokenLength,
      tx: db,
    });
    return {
      needsRetry: false,
      retryHistory: null,
    };
  }

  const bestAttempt = invoke((): Message => {
    if (retryHistory && retryHistory.prevBest.errorScore < errorScore) {
      return retryHistory.prevBest.response;
    }
    return assistantResponse;
  });
  const bestErrorScore = Math.min(
    errorScore,
    retryHistory?.prevBest.errorScore ?? Infinity,
  );

  return {
    needsRetry: true,
    retryHistory: {
      prevResponseAttempts: [
        ...(retryHistory?.prevResponseAttempts ?? []),
        assistantResponse,
      ],
      prevBest: {
        response: bestAttempt,
        errorScore: bestErrorScore,
      },
    },
  };
}
