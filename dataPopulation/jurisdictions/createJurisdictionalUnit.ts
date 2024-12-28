import { z } from "zod";
import { assertIsNotFailure } from "~/common/utils/result";
import { findJsonArray } from "~/common/utils/stringUtils";
import { getOpenRouterResponse } from "~/server/ai/llm";
import { getResponseText } from "~/server/ai/llm/responseText";
import {
  type Unit,
  type Course,
  type DetailedCourse,
} from "~/server/db/schema";

export async function createUnits(
  adminUserId: string,
  jurisdictionCourse: Course,
  generalCourse: DetailedCourse,
) {
  const units = Array<Unit>();

  const resp = await getOpenRouterResponse(adminUserId, {
    model: "anthropic/claude-3.5-sonnet:beta",
    messages: [
      {
        role: "user",
        content: `I'm creating a bar exam prep course for ${jurisdictionCourse.courseType.name}.`, I've created all of the general bar prep modules. They are as follows. Reply with the modules I should create for jurisdiction-specific requirements formatted like blah blah blah, or reply with "NONE_NECESSARY" if there are no jurisdiction-specific requirements.`,
      },
    ],
  });
  const msg = getResponseText(resp);
  assertIsNotFailure(msg);
  const newUnits = findJsonArray(msg, z.string());
  assertIsNotFailure(newUnits);

}
