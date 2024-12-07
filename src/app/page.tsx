"use client";

import { ClientOnly } from "./_components/ClientOnly";
import { Page } from "./_components/Page";
import { Courses } from "./_main/courses";
import { Logo, LogoText } from "./_components/Logo";
import { api } from "~/trpc/react";
import Link from "next/link";

export default function Home() {
  const h = 50;

  const { data: isLoggedIn } = api.auth.isLoggedIn.useQuery();

  return (
    <ClientOnly>
      <Page>
        <div className="mb-24 mt-32 flex items-center">
          <Logo height={h} />
          <LogoText className="text-6xl" />
        </div>
        {isLoggedIn ? (
          <div className="flex flex-grow flex-col items-center justify-between">
            <div>
              <Courses />
            </div>
            <Link
              href={"/api/auth/signout"}
              className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
            >
              {"Sign out"}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8">
            <h1 className="text-4xl font-bold">Welcome to the course!</h1>
            <p className="text-center text-lg">Please sign in to continue.</p>
            <a
              href="/api/auth/signin"
              className="rounded-full bg-blue-500 px-10 py-3 font-semibold text-white no-underline transition hover:bg-blue-600"
            >
              Sign in
            </a>
          </div>
        )}
      </Page>
    </ClientOnly>
  );
}
