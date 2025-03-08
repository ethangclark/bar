import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EmailInputPage } from "~/client/components/EmailInputPage";
import { NoScrollPage } from "~/client/components/Page";
import { useNotify } from "~/client/hooks/useNotify";
import { trpc } from "~/trpc/proxy";
import { api } from "~/trpc/react";

export function LoginPage() {
  const [notify, contextHolder] = useNotify();
  const [loading, setLoading] = useState(false);

  const { data: isLoggedIn } = api.auth.isLoggedIn.useQuery();
  const router = useRouter();
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/overview");
    }
  }, [isLoggedIn, router]);

  const handleSubmit = useCallback(
    async (email: string) => {
      setLoading(true);
      await trpc.auth.sendLoginEmail.mutate({ email });
      setLoading(false);
      notify({
        title: "Email sent",
        description: "Please check your email for a link to sign in.",
      });
    },
    [notify],
  );

  return (
    <NoScrollPage>
      {contextHolder}
      <EmailInputPage loading={loading} onSubmitEmail={handleSubmit} />
    </NoScrollPage>
  );
}
