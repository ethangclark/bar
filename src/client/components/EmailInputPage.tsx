import { Button, Form, Input } from "antd";
import { useCallback, useState } from "react";
import { z } from "zod";
import { useNotify } from "~/client/hooks/useNotify";
import { LoadingCentered } from "./Loading";
import { FrontPageLogo } from "./Logo";

export function EmailInputPage({
  loading,
  onSubmitEmail,
}: {
  loading: boolean;
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
    onSubmitEmail(email);
  }, [email, notify, onSubmitEmail]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      {contextHolder}
      <div className="mb-6">
        <FrontPageLogo />
      </div>
      <Form onFinish={handleSubmit} layout="inline" className="mb-8">
        <Form.Item name="email" label="Email">
          <Input
            disabled={loading}
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
        <Form.Item className="mr-0">
          <Button
            type="primary"
            htmlType="submit"
            disabled={!z.string().email().safeParse(email).success}
          >
            Sign in
          </Button>
        </Form.Item>
      </Form>
      <div className={loading ? "visible" : "invisible"}>
        <LoadingCentered />
      </div>
    </div>
  );
}
