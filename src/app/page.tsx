"use client";

import { Button } from "antd";
import Link from "next/link";
import { Image } from "~/client/components/Image";
import { Logo, LogoText } from "~/client/components/Logo";
import { Page } from "~/client/components/Page";

export default function Home() {
  return (
    <Page>
      <div className="mb-5 flex gap-24">
        <div className="flex flex-col items-center">
          <div className="flex items-center">
            <Logo height={50} />
            <LogoText className="text-4xl md:text-6xl" />
          </div>
          <h1 className="text-lg font-bold md:text-2xl">
            AI Learning Assistant
          </h1>
        </div>
        <div className="flex gap-4">
          <Button type="primary">Instructors</Button>
          <Button type="primary">Students</Button>
        </div>
      </div>
      <div className="flex flex-grow flex-col items-center justify-between">
        <div className="mb-4 flex flex-grow flex-col items-center justify-center md:gap-8">
          <h1 className="mb-[-24px] text-center text-4xl font-bold">
            Raising student achievement. Dramatically.
          </h1>
          <h2 className="text-center text-xl">
            Tutored student activities for less than the cost of a textbook
          </h2>
          <Image url="/images/bloom.png" alt="Hero" width={750} />
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
            <Link
              href={"/api/auth/signout"}
              className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
            >
              {"Sign out"}
            </Link>
          </div>
        </div>
        <div className="text-center text-sm text-gray-500">
          Questions? Comments? Email us at hello@summited.ai
        </div>
      </div>
    </Page>
  );
}
