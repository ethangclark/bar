"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ClientOnly } from "~/client/components/ClientOnly";
import {
  canvasBaseUrl,
  clientId,
  redirectUri,
} from "~/common/utils/canvasUtils";
import { api } from "~/trpc/react";

const state = Math.random().toString(36).substring(7); // could generate this legitimately + compare it in searchParams when invoked as callback

const linkParams = new URLSearchParams();
linkParams.append("client_id", clientId);
linkParams.append("response_type", "code");
linkParams.append("state", state);
linkParams.append("redirect_uri", redirectUri);

const Impl = () => {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const processCode = api.auth.processCanvasCode.useMutation();

  useEffect(() => {
    if (code) {
      void processCode.mutateAsync({ code });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <ClientOnly>
      <div>
        <h1>Canvas Login Page</h1>
        <a href={`${canvasBaseUrl}/login/oauth2/auth?${linkParams.toString()}`}>
          Login with Canvas
        </a>
      </div>
    </ClientOnly>
  );
};

export default function CanvasLoginPage() {
  return <Impl />;
}
