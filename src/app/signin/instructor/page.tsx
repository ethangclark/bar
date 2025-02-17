"use client";

import { useCallback } from "react";
import { EmailInputPage } from "~/client/components/EmailInputPage";
import { NoScrollPage } from "~/client/components/Page";
import { useNotify } from "~/client/hooks/useNotify";

export default function SignInInstructor() {
  const [notify, contextHolder] = useNotify();

  const handleSubmit = useCallback((email: string) => {
    notify({
      title: "Email sent",
      description: "Please check your email for a link to sign in.",
    });
  }, []);

  return (
    <NoScrollPage>
      {contextHolder}
      <EmailInputPage onSubmitEmail={handleSubmit} />
    </NoScrollPage>
  );
}
