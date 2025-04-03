import { eq, sql } from "drizzle-orm";
import { type LoginType, searchParamsX } from "~/common/searchParams";
import { getBaseUrl } from "~/common/urlUtils";
import { env } from "~/env";
import { db, schema } from "~/server/db";
import { hashToken } from "~/server/utils";
import { getOrCreateUser } from "../userService";
import { sendEmail } from "./sendEmail";
import { loginEmailHtml, loginEmailText } from "./setPasswordEmailUtils";

export async function sendSetPasswordEmail({
  email,
  encodedRedirect,
  loginType,
}: {
  email: string;
  encodedRedirect: string | null;
  loginType: LoginType | null;
}) {
  const user = await getOrCreateUser({ email, tx: db });

  const setPasswordToken = crypto.randomUUID();
  const setPasswordTokenHash = hashToken(setPasswordToken);

  await db
    .update(schema.users)
    .set({
      setPasswordTokenHash,
      setPasswordTokenCreatedAt: sql`now()`,
    })
    .where(eq(schema.users.id, user.id));

  // the encoding here technically isn't necessary so long as the token is a UUID,
  // but we do it anyway to be safe in case that impl changes
  let urlWithSetPasswordToken = `${getBaseUrl()}/login?${searchParamsX.setPasswordToken.key}=${encodeURIComponent(setPasswordToken)}`;
  if (encodedRedirect) {
    urlWithSetPasswordToken += `&${searchParamsX.redirectUrl.key}=${encodeURIComponent(encodedRedirect)}`;
  }
  if (loginType) {
    urlWithSetPasswordToken += `&${searchParamsX.loginType.key}=${encodeURIComponent(loginType)}`;
  }

  if (env.NODE_ENV !== "production") {
    console.log(`Login link:\n\n${urlWithSetPasswordToken}\n\n`);
  }

  if (env.QUICK_DEV_LOGIN) {
    // skip sending the email
  } else {
    await sendEmail({
      to: email,
      from: env.EMAIL_FROM,
      subject: "Sign in to to SummitEd",
      text: loginEmailText({ urlWithSetPasswordToken, email }),
      html: loginEmailHtml({ urlWithSetPasswordToken, email }),
    });
  }

  return { setPasswordToken };
}
