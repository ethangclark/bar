import { z } from "zod";
import { isFailure, type Result } from "~/common/utils/result";
import { aiObjectCreatorBuilder } from "~/server/ai/aiObjectCreatorBuilder/aiObjectCreatorBuilder";
import { testLogAsTxt } from "~/server/testLog";

const commandTypes = ["click_something", "type_text", "other"] as const;
const commandTypeSchema = z.enum(commandTypes);
export type CommandType = z.infer<typeof commandTypeSchema>;

export async function getCommandType({
  userId,
  naturalLanguageCommand,
}: {
  userId: string;
  naturalLanguageCommand: string;
}): Promise<
  Result<{
    commandType: CommandType;
  }>
> {
  const creator = aiObjectCreatorBuilder(
    "noImg",
    `Please analyze the following natural language command:

-- BEGIN COMMAND

${naturalLanguageCommand}

-- END COMMAND`,
  )
    .add({
      slug: "_commandType",
      prompt: `Reply with the type of command you would first need to execute in order to accomplish the action described in the command. The command type should be one of the following: ${commandTypes.join(",")}.`,
      ingestResponse({ response, prev, slug }) {
        const commandType = commandTypeSchema.parse(response);
        return {
          ...prev,
          [slug]: response,
          commandType,
        };
      },
    })
    .build();

  const result = await creator({
    userId,
  });
  if (isFailure(result)) {
    return result;
  }

  testLogAsTxt("naturalLanguageCommandTypeResult", result);

  const {
    data: { commandType },
  } = result;

  return { commandType };
}
