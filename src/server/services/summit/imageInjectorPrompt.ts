import { Message } from "~/server/db/schema";
import { imageHeaderWithOmissionDisclaimer } from "./summitIntro";

export const imageInjectorPrompt = (
  messages: Message[],
) => `Following is a series of messages between a student and an AI learning assistant. The AI learning assistant is only capable of interacting with the student via text -- hence you'll see some items in the initial system message that say "${imageHeaderWithOmissionDisclaimer}".

Your job is the following:

1. Identify whether the last message contains a description of an omitted image
2. If the last message does NOT contain a text description of an omitted image, reply with "<no-image></no-image>"
3. If the last message DOES contain a text description of an omitted image, you are to rewrite the message. The purpose of your rewriting is to note the number of the omitted image so that the system can inline it for the student, as well as to rework the language so that it makes sense given that the student will be able to see the message. Here's the format you are to follow as you do this:

<text>All the message content that goes before the image</text>
<image>The item number of the omitted image</image>
<text>All the message content that goes after the image</text>

As an example: Let's say the conversation includes the following:

"""
Great job! Let's move on to items 3-5.

To start with item 3: The mitochondria are the powerhouse of the cell. They live in the cell's cytoplasm.

Item 4 is an image of a mitochondrion. Here is the text alternative: The mitochondria are shown in purple, floating in the cytoplasm, in blue. They are kidney-shaped, and one of them has a cutaway that reveals its interior.

On to item 5: The cell membrane is the outermost layer of the cell. It is made up of a phospholipid bilayer.
"""

Here's how you might reply:

<text>
Great job! Let's move on to items 3-5.

To start with item 3: The mitochondria are the powerhouse of the cell. They live in the cell's cytoplasm.
</text>

<image>4</image>

<text>
Item 4 is an image of a mitochondrion. Here is the text alternative: The mitochondria are shown in purple, floating in the cytoplasm, in blue. They are kidney-shaped, and one of them has a cutaway that reveals its interior.

On to item 5: The cell membrane is the outermost layer of the cell. It is made up of a phospholipid bilayer.
</text>

Got it? :)

Here's the conversation between the student and the learning assistant:

${messages.map((message) => {
  return `# ${message.senderRole} message\n${message.content}\n\n`;
})}`;
