"use client";

import { Button, Typography } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LoadingNotCentered, LoadingPage } from "~/client/components/Loading";
import { LoginPage } from "~/client/components/LoginPage";
import { FrontPageLogo } from "~/client/components/Logo";
import { NoScrollPage } from "~/client/components/Page";
import { storeObserver } from "~/client/utils/storeObserver";
import { invoke } from "~/common/fnUtils";
import { searchParamsX } from "~/common/searchParams";
import { trpc } from "~/trpc/proxy";

const RootLoginPageInner = storeObserver(function RootLoginPageInner({
  userStore,
}) {
  const searchParams = useSearchParams();
  const loginToken = searchParams.get(searchParamsX.token.key);
  const rawRedirect = searchParams.get(searchParamsX.redirect.key);
  const router = useRouter();

  const [loggingIn, setLoggingIn] = useState(true);

  const [showBailOut, setShowBailOut] = useState(false);

  useEffect(() => {
    if (loginToken) {
      void invoke(async () => {
        const { succeeded, user } = await trpc.auth.autoLogin.mutate({
          loginToken,
        });
        if (succeeded) {
          user && userStore.setUser(user);
          if (rawRedirect) {
            router.push(decodeURIComponent(rawRedirect));
          } else {
            router.push("/overview");
          }
        } else {
          setLoggingIn(false);
        }
      });
    }
  }, [loginToken, rawRedirect, router, userStore]);

  if (!loginToken) {
    return <LoginPage />;
  }

  return (
    <NoScrollPage>
      <div className="flex h-full w-full flex-col items-center justify-center">
        <FrontPageLogo />
        <div className="my-10 flex items-center text-lg font-bold">
          <div className="relative">
            <Button
              type="primary"
              onClick={async () => {
                setLoggingIn(true);
                setTimeout(() => {
                  setShowBailOut(true);
                }, 10000);
                const { user } = await trpc.auth.login.mutate({ loginToken });
                user && userStore.setUser(user);
                if (rawRedirect) {
                  router.push(decodeURIComponent(rawRedirect));
                } else {
                  router.push("/overview");
                }
              }}
              className={loggingIn ? "invisible" : ""}
            >
              Complete login
            </Button>
            <div
              className={`absolute inset-0 flex items-center justify-center ${
                loggingIn ? "visible" : "invisible"
              }`}
            >
              <LoadingNotCentered />
            </div>
          </div>
        </div>
        <div className={`text-sm ${showBailOut ? "visible" : "invisible"}`}>
          Not working? Try{" "}
          <Typography.Link href="/">logging in again</Typography.Link>.
        </div>
      </div>
    </NoScrollPage>
  );
});

export default function RootLoginPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <RootLoginPageInner />
    </Suspense>
  );
}
