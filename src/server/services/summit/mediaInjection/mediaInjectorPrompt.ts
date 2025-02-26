// src/server/services/summit/mediaInjectorPrompt.ts
import {
  numericIdToImageNumber,
  numericIdToVideoNumber,
} from "~/common/idUtils";
import { type Message } from "~/server/db/schema";
import {
  imageHeaderWithOmissionDisclaimer,
  videoHeaderWithOmissionDisclaimer,
} from "../summitIntro";

const exampleImageNumericId = 5789;
const exampleVideoNumericId = 3;

export const mediaInjectorPrompt = (
  messages: Message[],
) => `Following is a series of messages between a student and an AI learning assistant. The AI learning assistant is only capable of interacting with the student via text -- hence you'll see some items in the initial system message that say e.g. "${imageHeaderWithOmissionDisclaimer(exampleImageNumericId)}" or "${videoHeaderWithOmissionDisclaimer(exampleVideoNumericId)}".

Your job is to identify where images and videos should be injected into the conversation and rewrite the message accordingly.

For each media element, use the following format:

<text>All the message content that goes before the media</text>
<image>The image number, such as ${numericIdToImageNumber(exampleImageNumericId)}</image>
<text>All the message content that goes between media elements</text>
<video>The video number, such as ${numericIdToVideoNumber(exampleVideoNumericId)}</video>
<text>All the message content that goes after the media</text>

Here's an example of how you should format your response:

<text>
Great job! Let's move on to the next items.

To start with: The mitochondria are the powerhouse of the cell. They live in the cell's cytoplasm.
</text>

<image>${numericIdToImageNumber(exampleImageNumericId)}</image>

<text>
Here you can see the mitochondria shown in purple, floating in the cytoplasm.

Now let's watch a video about cell division:
</text>

<video>${numericIdToVideoNumber(exampleVideoNumericId)}</video>

<text>
As you can see in the video, the cell divides into two daughter cells.

Let's continue with our discussion...
</text>

Here's the conversation between the student and the learning assistant:

${messages
  .map((message) => {
    return `# ${message.senderRole} message\n${message.content}\n\n`;
  })
  .join("")}`;
