// src/server/services/summit/videoInjectorPrompt.ts
import { type Message } from "~/server/db/schema";
import { videoOmissionDisclaimer } from "./summitIntro";

export function videoInjectorPrompt(messages: Message[]) {
  return `I need to identify where videos should be injected into a conversation. 
The conversation is between a student and an AI tutor. The tutor sometimes describes videos, 
and I need to replace those descriptions with the actual videos.

Here's the conversation:
${messages.map((m) => `${m.senderRole}: ${m.content}`).join("\n\n")}

I need to identify places where the tutor mentions a video with the phrase "${videoOmissionDisclaimer}".
For each such mention, I need to:
1. Extract the numeric ID of the video (which appears as "Video X" where X is a number)
2. Determine the text that should appear before the video
3. Determine the text that should appear after the video

Please respond with a JSON array of objects. Each object should have:
- "type": "text" or "video"
- If "type" is "text", include "textContent" with the text
- If "type" is "video", include "numericId" (the number X from "Video X")

For example:
[
  {"type": "text", "textContent": "Let's look at this video:"},
  {"type": "video", "numericId": 1},
  {"type": "text", "textContent": "As you can see in the video above..."}
]

If there are no videos to inject, return an empty array: []`;
}
