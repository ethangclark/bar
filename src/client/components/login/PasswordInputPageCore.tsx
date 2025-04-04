import { Alert, Button, Form, Input } from "antd";
import { useCallback, useState } from "react";
import { z } from "zod";
import { useNotify } from "~/client/hooks/useNotify";
import { assertTypesExhausted } from "~/common/assertions";
import { invoke } from "~/common/fnUtils";
import { trpc } from "~/trpc/proxy";
import { LoadingCentered } from "../Loading";
import { InputPageWrapper } from "./InputPageWrapper";

export function PasswordInputPageCore({
  email,
  loading,
  stage,
  onSubmitPassword,
  loginFailed,
  encodedRedirect,
}: {
  email: string;
  loading: boolean;
  stage: "setPassword" | "enterPassword";
  onSubmitPassword: (password: string) => void;
  loginFailed?: boolean;
  encodedRedirect: string | null;
}) {
  const [password, setPassword] = useState("");
  const [blurred, setBlurred] = useState(false);

  const handleSubmit = useCallback(() => {
    onSubmitPassword(password);
  }, [password, onSubmitPassword]);

  const [notify, contextHolder] = useNotify();

  const [sendingResetEmail, setSendingResetEmail] = useState(false);

  return (
    <InputPageWrapper>
      {contextHolder}
      <div className="mb-6">
        <p>Signing in as {email}</p>
      </div>
      <Form onFinish={handleSubmit} layout="inline" className="mb-6">
        <Form.Item name="password" label="Password">
          <Input
            disabled={loading}
            type="password"
            placeholder={invoke(() => {
              switch (stage) {
                case "setPassword":
                  return "Create password";
                case "enterPassword":
                  return "Password";
                default:
                  assertTypesExhausted(stage);
              }
            })}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setBlurred(false);
            }}
            onBlur={() => setBlurred(true)}
            status={
              blurred && z.string().safeParse(password).error
                ? "error"
                : undefined
            }
          />
        </Form.Item>
        <Form.Item className="mr-0">
          <Button
            type="primary"
            htmlType="submit"
            disabled={!z.string().safeParse(password).success}
          >
            Log in
          </Button>
        </Form.Item>
      </Form>
      <Button
        size="small"
        type="text"
        disabled={loading}
        onClick={async () => {
          setSendingResetEmail(true);
          await trpc.auth.sendSetPasswordEmail.mutate({
            email,
            encodedRedirect,
            loginType: null,
          });
          setSendingResetEmail(false);
          notify({
            title: "Password reset email sent",
            description:
              "Please check your email for a link to set your password.",
          });
        }}
      >
        Forgot your password? Click here.
      </Button>
      <div className={loginFailed ? "visible" : "invisible"}>
        <Alert message="Invalid password" type="error" />
      </div>
      <div className={loading || sendingResetEmail ? "visible" : "invisible"}>
        <LoadingCentered />
      </div>
    </InputPageWrapper>
  );
}
