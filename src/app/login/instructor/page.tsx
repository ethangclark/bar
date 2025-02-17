"use client";

import { useCallback, useState } from "react";
import { EmailInputPage } from "~/client/components/EmailInputPage";
import { NoScrollPage } from "~/client/components/Page";
import { useNotify } from "~/client/hooks/useNotify";
import { trpc } from "~/trpc/proxy";

export default function LogInInstructor() {
  const [notify, contextHolder] = useNotify();
  const [loading, setLoading] = useState(false);

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
