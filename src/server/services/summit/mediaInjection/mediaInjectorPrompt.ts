// src/server/services/summit/mediaInjectorPrompt.ts

export const mediaInjectorPrompt = ({
  assistantMessageContent,
}: {
  assistantMessageContent: string;
}) => `Following is message from an AI learning assistant to a student. The AI learning assistant is only capable of interacting with the student via text, but there are images and videos in the activity it's assisting with, so messages may reference specific images or videos (which have numbers associated with them, like "Image 1001" or "Video 537").

Please do the following:

1. Identify whether the last message references specific images or videos.
2. If it does not, reply with "<no-media></no-media>"
3. If it does, rewrite it, adding <image> or <video> tags strategically to show where in the message it would make sense to render the image or video for a student to see.

You can show images and videos to the student by wrapping image and video numbers in <image> and <video> tags. Here are examples of how you should transform messages:

EXAMPLE 1:

INPUT:
Let's look at image 1000. This image shows a mitochondrion with details of the mitochondrial membrane and mitochondrial DNA. Notice the folded inner membrane that creates the cristae structures.

OUTPUT:
Let's look at image 1000.

<image>1000</image>

This image shows a mitochondrion with details of the mitochondrial membrane and mitochondrial DNA. Notice the folded inner membrane that creates the cristae structures.

END EXAMPLE 1

EXAMPLE 2:

INPUT:
To understand this concept better, I recommend watching video 7893. In this Olympic gymnastics routine, you'll see how momentum is conserved throughout the athlete's movements, especially during the aerial maneuvers and landings.

OUTPUT:
To understand this concept better, I recommend watching video 7893.

<video>7893</video>

In this Olympic gymnastics routine, you'll see how momentum is conserved throughout the athlete's movements, especially during the aerial maneuvers and landings.

END EXAMPLE 2

EXAMPLE 3:

INPUT:
The quadratic formula is x = (-b ± √(b² - 4ac)) / 2a, which allows us to solve any quadratic equation in the form ax² + bx + c = 0. Let's practice with a few examples to make sure you understand how to apply it.

OUTPUT:
<no-media></no-media>

END EXAMPLE 3

EXAMPLE 4:

INPUT:
Let me show you two different volcanic formations. Image 361 shows a shield volcano with its gently sloping sides, while image 362 displays a stratovolcano with steeper sides. The difference in shape is due to the viscosity of the lava that formed them.

OUTPUT:
Let me show you two different volcanic formations. Image 361 shows a shield volcano with its gently sloping sides:

<image>361</image>

While image 362 displays a stratovolcano with steeper sides:

<image>362</image>

The difference in shape is due to the viscosity of the lava that formed them.

END EXAMPLE 4

ALWAYS put <image> and <video> tags on their own line! Do NOT mix them in with regular sentences -- there should be a paragraph break between regular text and these tags.

Here is the message you're analyzing:

BEGIN MESSAGE

${assistantMessageContent}

END MESSAGE`;
