"use client";

import { Button, Dropdown } from "antd";
import { Image } from "~/client/components/Image";
import { LinkX } from "~/client/components/Link";
import { FrontPageLogo } from "~/client/components/Logo";
import { Page } from "~/client/components/Page";

export default function Home() {
  return (
    <Page>
      <div className="mb-5 flex w-full items-center justify-between">
        <div className="flex flex-col items-center">
          <FrontPageLogo />
          <h1 className="text-lg font-bold md:text-xl">
            AI Learning Assistant
          </h1>
        </div>
        <div className="flex gap-4">
          <Dropdown
            menu={{
              items: [
                {
                  key: "instructors",
                  label: (
                    <LinkX href="/login/instructor">For instructors</LinkX>
                  ),
                },
                {
                  key: "student",
                  label: <LinkX href="/login/student">For students</LinkX>,
                },
              ],
            }}
          >
            <Button type="primary" size="large">
              Sign up
            </Button>
          </Dropdown>
          <Dropdown
            menu={{
              items: [
                {
                  key: "instructors",
                  label: (
                    <LinkX href="/login/instructor">For instructors</LinkX>
                  ),
                },
                {
                  key: "students",
                  label: <LinkX href="/login/student">For students</LinkX>,
                },
              ],
            }}
          >
            <Button size="large">Sign in</Button>
          </Dropdown>
        </div>
      </div>
      <div className="flex flex-grow flex-col items-center justify-between">
        <div className="mb-4 flex flex-grow flex-col items-center justify-center md:gap-8">
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-center text-4xl font-bold">
              Dramatically improve student achievement
            </h1>
            <h2 className="text-center text-xl">
              Tutored student activities for less than the cost of a textbook
            </h2>
          </div>
          <Image
            url="/images/bloom.png"
            alt="Bloom's research showing a massive increase in student achievement with the use of tutorial education"
            width={750}
          />
        </div>
        <div className="text-center text-sm text-gray-500">
          Questions? Comments? Email us at hello@summited.ai
        </div>
      </div>
    </Page>
  );
}
