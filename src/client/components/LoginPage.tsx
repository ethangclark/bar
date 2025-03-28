import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EmailInputPage } from "~/client/components/EmailInputPage";
import { NoScrollPage } from "~/client/components/Page";
import { useNotify } from "~/client/hooks/useNotify";
import { storeObserver } from "~/client/utils/storeObserver";
import { searchParamsX } from "~/common/searchParams";
import { trpc } from "~/trpc/proxy";
import { api } from "~/trpc/react";

export const LoginPage = storeObserver<{ forInstructor?: boolean }>(
  function LoginPage({ userStore, forInstructor = false }) {
    const [notify, contextHolder] = useNotify();
    const [submitting, setSubmitting] = useState(false);
    const rawRedirect = useSearchParams().get(searchParamsX.redirectUrl.key);

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

    const handleSubmit = useCallback(
      async (email: string) => {
        setSubmitting(true);
        const loginDeets = await trpc.auth.sendLoginEmail.mutate({
          email,
          encodedRedirect: rawRedirect,
          loginType: forInstructor ? "instructor" : null,
        });
        if (loginDeets.isLoggedIn && loginDeets.user) {
          userStore.setUser(loginDeets.user);
          router.push("/overview");
        }
        setSubmitting(false);
        notify({
          title: "Email sent",
          description: "Please check your email for a link to sign in.",
        });
      },
      [notify, rawRedirect, router, userStore, forInstructor],
    );

    const loading = isLoggedInLoading || submitting;

    return (
      <NoScrollPage>
        {contextHolder}
        <EmailInputPage loading={loading} onSubmitEmail={handleSubmit} />
      </NoScrollPage>
    );
  },
);
