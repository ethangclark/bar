"use client";

import Link from "next/link";
import { api } from "~/trpc/react";
import { BigTitlePage } from "./_components/BigTitlePage";
import { ClientOnly } from "./_components/ClientOnly";
import { Courses } from "./_main/courses";

export default function Home() {
  const { data: isLoggedIn } = api.auth.isLoggedIn.useQuery();
  const { data: seatsRemaining } = api.auth.seatsRemaining.useQuery();

  return (
    <ClientOnly>
      <BigTitlePage>
        {isLoggedIn ? (
          <div className="mt-20 flex flex-grow flex-col items-center justify-between">
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
            <div className="mb-4 flex flex-grow flex-col items-center justify-center md:gap-8">
              <h1 className="w-full pb-8 text-center text-4xl font-bold md:text-[108px] md:leading-[120px]">
                Pass the bar with confidence
              </h1>
              <div
                className="mb-6 flex flex-col items-center gap-6 text-center md:gap-8"
                style={{ maxWidth: 450 }}
              >
                <p>
                  SummitEd.ai provides an instant chat and voice-based tutor
                  that reviews all the material you need to pass the bar,
                  drilling into areas of improvement until you've reached
                  proficiency.
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
              {(seatsRemaining ?? 0) > 0 && (
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
              )}
            </div>
            <div
              className="text-center text-sm text-gray-500"
              style={{ marginBottom: -24 }}
            >
              Questions? Comments? Email us at hello@summited.ai
            </div>
          </div>
        )}
      </BigTitlePage>
    </ClientOnly>
  );
}
