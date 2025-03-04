import nodemailer from "nodemailer";
import { env } from "~/env";

export async function sendEmail(params: {
  to: string | string[];
  from: string;
  subject: string;
  text: string;
  html: string;
}) {
  const transport = nodemailer.createTransport(env.EMAIL_SERVER);
  const result = await transport.sendMail(params);

  if (env.NODE_ENV !== "production") {
    console.log(
      "Sent email; preview URL: %s",
      nodemailer.getTestMessageUrl(result),
    );
  }
}
