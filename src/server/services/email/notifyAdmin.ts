import superjson from "superjson";
import { type SuperJSONValue } from "~/common/types";
import { sendEmail } from "./sendEmail";

export async function notifyAdmin(subject: string, detail: SuperJSONValue) {
  const content = `json:\n\n${JSON.stringify(detail, null, 2)}\n\nsuperjson:\n\n${superjson.stringify(detail)}`;
  await sendEmail({
    to: "ethangclark@gmail.com",
    from: "hello@summited.ai",
    subject,
    text: content,
    html: `<pre>${content}</pre>`,
  });
}
