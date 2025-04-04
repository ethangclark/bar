import superjson from "superjson";
import { type SuperJsonValue } from "~/common/types";
import { sendEmail } from "./sendEmail";

export async function notifyAdmin(subject: string, detail: SuperJsonValue) {
  const content = `json:\n\n${JSON.stringify(detail, null, 2)}\n\nsuperjson:\n\n${superjson.stringify(detail)}`;
  await sendEmail({
    to: ["ethangclark@gmail.com", "hello@summited.ai"],
    from: "hello@summited.ai",
    subject,
    text: content,
    html: `<pre>${content}</pre>`,
  });
}

export const alertAdmin = notifyAdmin;
