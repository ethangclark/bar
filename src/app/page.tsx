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
  const { data: seatsRemaining } = api.auth.seatsRemaining.useQuery();

  return (
    <ClientOnly>
      <Page>
        <div className="flex flex-col items-center">
          <div className="flex items-center">
            <Logo height={h} />
            <LogoText className="text-6xl" />
          </div>
          <h1 className="text-2xl font-bold">February 2025 Bar Exam Prep</h1>
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
          <div className="flex flex-grow flex-col items-center justify-between">
            <div className="mb-4 flex flex-grow flex-col items-center justify-center gap-8">
              <h1
                className="w-full pb-8 text-center font-bold"
                style={{ fontSize: 108, lineHeight: "120px" }}
              >
                Pass the bar with confidence
              </h1>
              <div
                className="flex flex-col items-center gap-8 text-center"
                style={{ maxWidth: 450 }}
              >
                <p>
                  SummitEd is an instant chat and voice-based tutor that reviews
                  all the material you need to pass the bar, drilling into areas
                  of improvement until you've reached proficiency.
                </p>
                <p>
                  We are providing <span className="font-bold">free</span>{" "}
                  access to 200 signups.
                </p>
                <p className="flex items-center">
                  <span className="mr-1">Seats remaining:</span>
                  <span className="font-bold">{seatsRemaining}</span>
                </p>
              </div>
              <div className="flex gap-4">
                <a
                  href="/api/auth/signin"
                  className="rounded-full bg-blue-500 px-10 py-3 font-semibold text-white no-underline transition hover:bg-blue-600"
                >
                  Sign up
                </a>
                <a
                  href="/api/auth/signin"
                  className="rounded-full bg-gray-300 px-10 py-3 font-semibold no-underline transition hover:bg-blue-200"
                >
                  Sign in
                </a>
              </div>
            </div>
            <div
              className="text-sm text-gray-500"
              style={{ marginBottom: -24 }}
            >
              Questions? Comments? Email us at hello@summited.ai
            </div>
          </div>
        )}
      </Page>
    </ClientOnly>
  );
}
