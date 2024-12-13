import Email from "next-auth/providers/email";
import nodemailer from "nodemailer";
import { html, text } from "./emailUtils";

export const emailProvider = Email({
  server: process.env.EMAIL_SERVER,
  from: process.env.EMAIL_FROM,
  async sendVerificationRequest({ identifier: email, url, provider }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const transport = nodemailer.createTransport(provider.server);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const result = await transport.sendMail({
      to: email,
      from: provider.from,
      subject: "Sign in to your account",
      text: text({ urlWithLoginToken: url, email }),
      html: html({ urlWithLoginToken: url, email }),
    });

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      console.log(
        "Email preview URL: %s",
        nodemailer.getTestMessageUrl(result),
      );
      console.log("Login link: %s", url);
    }
  },
});
