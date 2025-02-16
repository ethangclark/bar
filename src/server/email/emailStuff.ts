import nodemailer from "nodemailer";
import { env } from "~/env";
import { html, text } from "./emailUtils";

// Will have to ChatGPT etc how to create a nodemailer transport using gmail token or whatever
export const emailStuff = {
  server: env.EMAIL_SERVER,
  from: env.EMAIL_FROM,
  async sendVerificationRequest({
    email,
    urlWithLoginToken,
    provider,
  }: {
    email: string;
    urlWithLoginToken: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider: any;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const transport = nodemailer.createTransport(provider.server);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const result = await transport.sendMail({
      to: email,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      from: provider.from,
      subject: "Sign in to your account",
      text: text({ urlWithLoginToken, email }),
      html: html({ urlWithLoginToken, email }),
    });

    if (env.NODE_ENV !== "production") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      console.log(
        "Email preview URL: %s",
        nodemailer.getTestMessageUrl(result),
      );
      console.log("Login link: %s", url);
    }
  },
};
