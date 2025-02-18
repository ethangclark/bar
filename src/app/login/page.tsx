"use client";

import { Typography } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LoadingNotCentered, LoadingPage } from "~/client/components/Loading";
import { FrontPageLogo } from "~/client/components/Logo";
import { NoScrollPage } from "~/client/components/Page";
import { Redirect } from "~/client/components/Redirect";
import { loginTokenQueryParam } from "~/common/constants";
import { invoke } from "~/common/fnUtils";
import { trpc } from "~/trpc/proxy";

function LoginPageInner() {
  const searchParams = useSearchParams();
  const loginToken = searchParams.get(loginTokenQueryParam);
  const router = useRouter();

  useEffect(() => {
    if (!loginToken) {
      router.push("/");
      return;
    }
    void invoke(async () => {
      await trpc.auth.login.mutate({ loginToken });
      router.push("/overview");
    });
  }, [loginToken, router]);

  const [showBailOut, setShowBailOut] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setShowBailOut(true);
    }, 10000);
  }, []);

  if (!loginToken) {
    return <Redirect to="/" />;
  }

  return (
    <NoScrollPage>
      <div className="flex h-full w-full flex-col items-center justify-center">
        <FrontPageLogo />
        <div className="my-10 flex items-center text-lg font-bold">
          <LoadingNotCentered />
          <div className="ml-4">Logging in...</div>
        </div>
        <div className={`text-sm ${showBailOut ? "visible" : "invisible"}`}>
          Not working? Try{" "}
          <Typography.Link href="/">logging in again</Typography.Link>.
        </div>
      </div>
    </NoScrollPage>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <LoginPageInner />
    </Suspense>
  );
}
