import { and, eq, isNull } from "drizzle-orm";
import { loginTokenQueryParam } from "~/common/constants";
import { getBaseUrl } from "~/common/urlUtils";
import { env } from "~/env";
import { db } from "~/server/db";
import { hashLoginToken } from "~/server/utils";
import { getOrCreateVerifiedEmailUser } from "../authService";
import { loginEmailHtml, loginEmailText } from "./loginEmailUtils";
import { sendEmail } from "./sendEmail";

export async function sendLoginEmail({ email }: { email: string }) {
  await db
    .delete(db.x.users)
    .where(
      and(isNull(db.x.users.email), eq(db.x.users.unverifiedEmail, email)),
    );

  const user = await getOrCreateVerifiedEmailUser({ email, tx: db });

  const loginToken = crypto.randomUUID();
  const loginTokenHash = hashLoginToken(loginToken);

  await db
    .update(db.x.users)
    .set({ loginTokenHash })
    .where(eq(db.x.users.id, user.id));

  const urlWithLoginToken = `${getBaseUrl()}/login?${loginTokenQueryParam}=${loginToken}`;

  await sendEmail({
    to: email,
    from: env.EMAIL_FROM,
    subject: "Sign in to to SummitEd",
    text: loginEmailText({ urlWithLoginToken, email }),
    html: loginEmailHtml({ urlWithLoginToken, email }),
  });

  if (env.NODE_ENV !== "production") {
    console.log("Login link: %s", urlWithLoginToken);
  }
}
