import { Form, Input } from "antd";
import { useCallback, useState } from "react";
import { z } from "zod";
import { useNotify } from "~/client/hooks/useNotify";
import { FrontPageLogo } from "./Logo";

export function EmailInputPage({
  onSubmitEmail,
}: {
  onSubmitEmail: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [blurred, setBlurred] = useState(false);

  const [notify, contextHolder] = useNotify();

  const handleSubmit = useCallback(() => {
    if (!z.string().email().safeParse(email).success) {
      setBlurred(true);
      notify({
        title: "Invalid email",
        description: "Please enter a valid email address.",
      });
      return;
    }
    // notify({
    //   title: "Email sent",
    //   description: "Please check your email for a link to sign in.",
    // });
    onSubmitEmail(email);
  }, [email]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      {contextHolder}
      <div className="mb-6">
        <FrontPageLogo />
      </div>
      <Form onFinish={handleSubmit}>
        <Form.Item name="email" label="Email">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setBlurred(false);
            }}
            onBlur={() => setBlurred(true)}
            status={
              blurred && z.string().email().safeParse(email).error
                ? "error"
                : undefined
            }
          />
        </Form.Item>
      </Form>
    </div>
  );
}
