// src/server/services/summit/mediaInjectorPrompt.ts
import {
  numericIdToImageNumber,
  numericIdToVideoNumber,
} from "~/common/idUtils";

const exampleImageNumericId = 5789;
const exampleVideoNumericId = 3;

export const mediaInjectorPrompt = ({
  lastAssistantMessage,
}: {
  lastAssistantMessage: string;
}) => `Following is a message sent by an AI learning assistant to a student. The AI learning assistant is only capable of interacting with the student via text, but there are images and videos in the activity it's helping with, so the message may include descriptions of specific images or videos (which have numbers associated with them, like "Image 1001" or "Video 537").

Please do the following:

1. Identify whether the message describes specific images or videos
2. If it does not, reply with "<no-media></no-media>"
3. If it does, rewrite the message using the format described below. This format will allow the system to render the media so the student can see it.

Here's the format to use:

<text>All the message content that goes before the media</text>
<image>The image number, such as ${numericIdToImageNumber(exampleImageNumericId)}</image>
<text>All the message content that goes between media elements</text>
<video>The video number, such as ${numericIdToVideoNumber(exampleVideoNumericId)}</video>
<text>All the message content that goes after the media</text>

Here's an example of what a response should look like:

<text>
Great job! Let's move on to the next items.

To start with: The mitochondria are the powerhouse of the cell. They live in the cell's cytoplasm.
</text>

<image>${numericIdToImageNumber(exampleImageNumericId)}</image>

<text>
In image ${numericIdToImageNumber(exampleImageNumericId)} above, you can see the mitochondria shown in purple, floating in the cytoplasm.

Now let's watch a video about cell division:
</text>

<video>${numericIdToVideoNumber(exampleVideoNumericId)}</video>

<text>
As you can see in video ${numericIdToVideoNumber(exampleVideoNumericId)} above, the cell divides into two daughter cells.

Let's continue with our discussion...
</text>

Here's the message you're analyzing:

${lastAssistantMessage}`;
