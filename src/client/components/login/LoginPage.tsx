import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EmailInputPageCore } from "~/client/components/login/EmailInputPageCore";
import { useNotify } from "~/client/hooks/useNotify";
import { useIsClientSide } from "~/client/utils/isClientSide";
import { storeObserver } from "~/client/utils/storeObserver";
import { assertTypesExhausted } from "~/common/assertions";
import { invoke } from "~/common/fnUtils";
import { searchParamsX } from "~/common/searchParams";
import { trpc } from "~/trpc/proxy";
import { api } from "~/trpc/react";
import { LoadingCentered } from "../Loading";
import { PasswordInputPageCore } from "./PasswordInputPageCore";

export const LoginPage = storeObserver<{ forInstructor?: boolean }>(
  function LoginPage({ userStore, forInstructor = false, locationStore }) {
    const [notify, contextHolder] = useNotify();
    const encodedRedirect = useSearchParams().get(
      searchParamsX.redirectUrl.key,
    );

    const [stage, setStage] = useState<
      "email" | "setPassword" | "enterPassword"
    >(() => {
      const token = locationStore.searchParam("setPasswordToken");
      return token ? "setPassword" : "email";
    });

    const { data, isLoading: isLoggedInLoading } =
      api.auth.basicSessionDeets.useQuery();
    const router = useRouter();
    useEffect(() => {
      if (!data) {
        return;
      }
      const { isLoggedIn, user } = data;
      if (isLoggedIn) {
        user && userStore.setUser(user);
        router.push("/overview");
      }
    }, [data, router, userStore]);

    const [email, setEmail] = useState("");
    const [isPwSetLoading, setIsPwSetLoading] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const handleSubmitEmail = useCallback(
      async (emailSubmitted: string) => {
        setEmail(emailSubmitted);
        setIsPwSetLoading(true);
        const { result } = await trpc.auth.prePasswordActions.mutate({
          email: emailSubmitted,
          encodedRedirect,
          loginType: forInstructor ? "instructor" : null,
        });
        switch (result) {
          case "okdPwExists":
            setStage("enterPassword");
            break;
          case "sentReset":
            setResetEmailSent(true);
            notify({
              title: "Email sent",
              description:
                "Please check your email for a link to set your password.",
            });
            break;
          default:
            assertTypesExhausted(result);
        }
        setIsPwSetLoading(false);
      },
      [forInstructor, notify, encodedRedirect],
    );

    const [submitting, setSubmitting] = useState(false);

    const handleSetPassword = useCallback(
      async (password: string) => {
        setSubmitting(true);
        const token = locationStore.searchParam("setPasswordToken");
        if (!token) {
          throw new Error("No token found");
        }
        const user = await trpc.auth.setPassword.mutate({
          token,
          password,
          loginType: forInstructor ? "instructor" : null,
        });
        userStore.setUser(user);
        if (encodedRedirect) {
          router.push(decodeURIComponent(encodedRedirect));
        } else {
          router.push("/overview");
        }
        setSubmitting(false);
      },
      [encodedRedirect, forInstructor, locationStore, router, userStore],
    );

    const [loginFailed, setLoginFailed] = useState(false);
    const handleSubmitPassword = useCallback(
      async (password: string) => {
        setLoginFailed(false);
        setSubmitting(true);
        const { isLoggedIn, user } = await trpc.auth.login.mutate({
          email,
          password,
        });
        if (isLoggedIn) {
          user && userStore.setUser(user);
          if (encodedRedirect) {
            router.push(decodeURIComponent(encodedRedirect));
          } else {
            router.push("/overview");
          }
        } else {
          setLoginFailed(true);
        }
        setSubmitting(false);
      },
      [email, encodedRedirect, router, userStore],
    );

    const isClientSide = useIsClientSide();

    if (!isClientSide) {
      return <LoadingCentered />;
    }

    const loading = isLoggedInLoading || submitting || isPwSetLoading;

    return (
      <>
        {contextHolder}
        {invoke(() => {
          switch (stage) {
            case "email":
              return (
                <EmailInputPageCore
                  loading={loading}
                  onSubmitEmail={handleSubmitEmail}
                  resetEmailSent={resetEmailSent}
                />
              );
            case "setPassword":
              return (
                <PasswordInputPageCore
                  loading={loading}
                  stage="setPassword"
                  onSubmitPassword={handleSetPassword}
                />
              );
            case "enterPassword":
              return (
                <PasswordInputPageCore
                  loading={loading}
                  stage="enterPassword"
                  onSubmitPassword={handleSubmitPassword}
                  loginFailed={loginFailed}
                />
              );
            default:
              assertTypesExhausted(stage);
          }
        })}
      </>
    );
  },
);
