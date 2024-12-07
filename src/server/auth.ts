import { DrizzleAdapter } from "@auth/drizzle-adapter";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { type Adapter } from "next-auth/adapters";
import Email from "next-auth/providers/email";
import nodemailer from "nodemailer";
import escapeHtml from "escape-html";

import { db } from "~/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "~/server/db/schema";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

// Email HTML body
export function html({
  urlWithLoginToken,
  email,
}: {
  urlWithLoginToken: string;
  email: string;
}) {
  const escapedEmail = `${email.replace(/\./g, "&#8203;.")}`;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const escapedUrl = escapeHtml(urlWithLoginToken);
  return `
    <body>
      <p>Sign into SummitEd.ai as <strong>${escapedEmail}</strong> by clicking <a href="${urlWithLoginToken}">here</a>, or by vising the following link:<br><br><a href="${urlWithLoginToken}">${escapedUrl}</a></p>
    </body>
  `;
}

// Email text body
export function text({
  urlWithLoginToken,
  email,
}: {
  urlWithLoginToken: string;
  email: string;
}) {
  return `Sign in to SummitEd.ai as ${email} with this link: ${urlWithLoginToken}\n\n`;
}

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
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(result));
    }
  },
});

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }) as Adapter,
  providers: [emailProvider],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
