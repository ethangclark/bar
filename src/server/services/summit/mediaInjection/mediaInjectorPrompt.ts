// src/server/services/summit/mediaInjectorPrompt.ts

export const mediaInjectorPrompt = ({
  assistantMessageContent,
}: {
  assistantMessageContent: string;
}) => `Following is message from an AI learning assistant to a student. The AI learning assistant is only capable of interacting with the student via text, but there are images and videos in the activity it's assisting with, so messages may reference specific images or videos (which have numbers associated with them, like "Image 1001" or "Video 537").

Please do the following:

1. Identify whether the last message references specific images or videos.
2. If it does not, reply with "<no-media></no-media>"
3. If it does, rewrite it, adding <image> or <video> tags in positions where it would make sense to render the image or video for a student to see, removing the description of the image or video (since the student will be able to see it), and updating the wording of the message to reflect that an image or video is being shown (and not just described).

You can show images and videos to the student by wrapping image and video numbers in <image> and <video> tags. Here are example messages you might receive and examples of responses you might provide:

## Example 1

### Message
Let's look at image 1000. The description of this image is: a mitochondrion with details of the mitochondrial membrane and mitochondrial DNA, its folded inner membrane forming the cristae structures. Do you have any questions about it?

### Response
Following is image 1000, which pictures a mitochondrion:

<image>1000</image>

Do you have any questions about it?

## Example 2

### Message
We will now move on to item 5. Here is a description of image 1004:

A butane lighter is shown in 3 panels. In the first panel, on the left, the butane fill line is indicated, and it's shown that above the line, butane particles are dispersed, and below the line, they are tightly-packed. In the second panel, in the center, it's shown that the lever has been pushed down without making sparks; butane is shown in dispersed form above the lighter. In the third pane, on the right, it's shown that the lever was pushed after making sparks, and that the butane no longer exists outside of the lighter, but rather that a flame has been created and that dispersed water vapor and carbon dioxide particles now exist above the lighter.

Let me know when you are ready to move on.

### Response
Following is image 1004, which pictures the structure and function of a butane lighter:

<image>1004</image>

Let me know when you're ready to move on.

## Example 3

### Message
The quadratic formula is x = (-b ± √(b² - 4ac)) / 2a, which allows us to solve any quadratic equation in the form ax² + bx + c = 0. Let's practice with a few examples to make sure you understand how to apply it.

### Response
<no-media></no-media>

## Example 4

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
