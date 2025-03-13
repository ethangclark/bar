import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EmailInputPage } from "~/client/components/EmailInputPage";
import { NoScrollPage } from "~/client/components/Page";
import { useNotify } from "~/client/hooks/useNotify";
import { storeObserver } from "~/client/utils/storeObserver";
import { redirectQueryParam } from "~/common/constants";
import { trpc } from "~/trpc/proxy";
import { api } from "~/trpc/react";

export const LoginPage = storeObserver(function LoginPage({ userStore }) {
  const [notify, contextHolder] = useNotify();
  const [submitting, setSubmitting] = useState(false);
  const rawRedirect = useSearchParams().get(redirectQueryParam);

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
      await trpc.auth.sendLoginEmail.mutate({
        email,
        encodedRedirect: rawRedirect,
      });
      setSubmitting(false);
      notify({
        title: "Email sent",
        description: "Please check your email for a link to sign in.",
      });
    },
    [notify, rawRedirect],
  );

  const loading = isLoggedInLoading || submitting;

  return (
    <NoScrollPage>
      {contextHolder}
      <EmailInputPage loading={loading} onSubmitEmail={handleSubmit} />
    </NoScrollPage>
  );
});
