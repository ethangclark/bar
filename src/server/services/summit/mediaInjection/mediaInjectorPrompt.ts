// src/server/services/summit/mediaInjectorPrompt.ts

export const mediaInjectorPrompt = ({
  assistantMessageContent,
}: {
  assistantMessageContent: string;
}) => `Following is message from an AI learning assistant to a student. The AI learning assistant is only capable of interacting with the student via text, but the lesson it's administrating contains images and videos, so it has been instructed to provide rich descriptions as an alternative. (Think "alt text" equivalents.)

Each image or video has a number associated with it, which the learning assistant has been instructed to include (like "Image 1001" or "Video 537").

Your task is to identify whether the last messages contains one of these "rich descriptions" of a specific image or video, and if so, to rewrite the message such that the student can view the image or video itself rather than the rich description.

Here are your instructions for how to accomplish this:

1. Identify whether the last message contains a rich description (akin to an "alt text" description) of a specific image or video. (NOTE: this does not mean a reference to a specific video, but a comprehensive description of the content of an image or video.)
2. If it does not, reply with "<no-media></no-media>"
3. If it does, rewrite the message, adding <image> or <video> tags in positions where it would make sense to render the image or video for a student to see, removing the description of the image or video (since the student will be able to see it), and updating the wording of the message to reflect that an image or video is being shown (and not just described).

Here are example messages you might receive and examples of responses you might provide:

## Example 1

### Message
Let's look at image 1000. The description of this image is: a mitochondrion with details of the mitochondrial membrane and mitochondrial DNA, its folded inner membrane forming the cristae structures. Do you have any questions about it?

### Response
Following is image 1000, which pictures a mitochondrion:

<image>1000</image>

Do you have any questions about it?

## Example 2

### Message
Not quite! Remember that we're dealing with squared units here. Think about how you would convert meters squared to centimeters squared. The video in item 1 might give you a hint. How many centimeters squared are in 1 meter squared?

### Response
<no-media></no-media>

## Example 3

### Message
We will now move on to item 5. Here is a description of image 1004:

A butane lighter is shown in 3 panels. In the first panel, on the left, the butane fill line is indicated, and it's shown that above the line, butane particles are dispersed, and below the line, they are tightly-packed. In the second panel, in the center, it's shown that the lever has been pushed down without making sparks; butane is shown in dispersed form above the lighter. In the third pane, on the right, it's shown that the lever was pushed after making sparks, and that the butane no longer exists outside of the lighter, but rather that a flame has been created and that dispersed water vapor and carbon dioxide particles now exist above the lighter.

Let me know when you are ready to move on.

### Response
Following is image 1004, which pictures the structure and function of a butane lighter:

<image>1004</image>

Let me know when you're ready to move on.

## Example 4

### Message
The quadratic formula is x = (-b ± √(b² - 4ac)) / 2a, which allows us to solve any quadratic equation in the form ax² + bx + c = 0. Let's practice with a few examples to make sure you understand how to apply it.

### Response
<no-media></no-media>

## Example 5

### Message
Let me show you two different volcanic formations. Image 361 can be described as a shield volcano with its gently sloping sides, while image 362 can be described as a stratovolcano with steeper sides. The difference in shape is due to the viscosity of the lava that formed them.

### Response
Let me show you two different volcanic formations.

<image>361</image>
<image>362</image>

The difference in shape is due to the viscosity of the lava that formed them.

# Additional guidance

ALWAYS put <image> and <video> tags on their own line! Do NOT mix them in with regular sentences -- there should be a paragraph break between regular text and these tags.

# Message to be analyzed

Following is the message you're analyzing:

### Message

${assistantMessageContent}
`;
