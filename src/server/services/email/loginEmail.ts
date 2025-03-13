import { and, eq, isNull, sql } from "drizzle-orm";
import { searchParamsX } from "~/common/searchParams";
import { getBaseUrl } from "~/common/urlUtils";
import { env } from "~/env";
import { db, schema } from "~/server/db";
import { hashLoginToken } from "~/server/utils";
import { getOrCreateVerifiedEmailUser } from "../authService";
import { loginEmailHtml, loginEmailText } from "./loginEmailUtils";
import { sendEmail } from "./sendEmail";

export async function sendLoginEmail({
  email,
  encodedRedirect,
}: {
  email: string;
  encodedRedirect: string | null | undefined;
}) {
  await db
    .delete(schema.users)
    .where(
      and(isNull(schema.users.email), eq(schema.users.unverifiedEmail, email)),
    );

  const user = await getOrCreateVerifiedEmailUser({ email, tx: db });

  const loginToken = crypto.randomUUID();
  const loginTokenHash = hashLoginToken(loginToken);

  await db
    .update(schema.users)
    .set({
      loginTokenHash,
      loginTokenCreatedAt: sql`now()`,
    })
    .where(eq(schema.users.id, user.id));

  // the encoding here technically isn't necessary so long as the token is a UUID,
  // but we do it anyway to be safe in case that impl changes
  let urlWithLoginToken = `${getBaseUrl()}/login?${searchParamsX.loginToken.key}=${encodeURIComponent(loginToken)}`;
  if (encodedRedirect) {
    urlWithLoginToken += `&${searchParamsX.redirectUrl.key}=${encodeURIComponent(encodedRedirect)}`;
  }

  if (env.NODE_ENV !== "production") {
    console.log("Login link: %s", urlWithLoginToken);
  }

  await sendEmail({
    to: email,
    from: env.EMAIL_FROM,
    subject: "Sign in to to SummitEd",
    text: loginEmailText({ urlWithLoginToken, email }),
    html: loginEmailHtml({ urlWithLoginToken, email }),
  });

  return { loginToken };
}
