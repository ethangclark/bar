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

You can show images and videos to the student by wrapping image and video numbers in <image> and <video> tags. Here's an example of how you might do that:

EXAMPLE 1:

Following is image 1000, which is a picture of a mitochondrion:

<image>1000</image>

This image shows details of the mitochondrial membrane and mitochondrial DNA.

END EXAMPLE 1

Notice how the sentence "Following is image 1000, which is a picture of a mitochondrion:" does NOT include the <image> tag, and the "<image>1000</image>" tag is on its own line. This is very important! Do NOT include XML tags in sentences -- they should be on their own lines.

Here are some more examples:

EXAMPLE 2:
Following is image 42, which is a picture of a volcanic eruption:

<image>42</image>

This image shows the dramatic lava flow and ash cloud from Mount Etna's recent activity.

END EXAMPLE 2

EXAMPLE 3:

Following is video 7893, which is footage of an Olympic gymnastics routine:

<video>7893</video>

This video captures the gold medal floor exercise with impressive aerial maneuvers and perfect landings.

END EXAMPLE 3

EXAMPLE 4:

Following is image 361, which is a picture of a rare astronomical event:

<image>361</image>

This image shows the transit of Venus across the sun, captured with specialized solar filtering equipment.

END EXAMPLE 4

ALWAYS put <image> and <video> tags on their own line! Do NOT mix them in with regular sentences -- there should be a paragraph break between regular text and these tags.

Here is the message you're analyzing:

${assistantMessageContent}`;
