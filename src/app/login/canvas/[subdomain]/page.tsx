"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import { LoadingPage } from "~/client/components/Loading";
import { getCanvasBaseUrl, getRedirectUrl } from "~/common/canvasUtils";
import { api } from "~/trpc/react";
import { CreateIntegration } from "./createIntegration";

const state = Math.random().toString(36).substring(7); // could generate this legitimately + compare it in searchParams when invoked as callback

export default function CanvasLoginPage() {
  const params = useParams();
  const { subdomain } = z.object({ subdomain: z.string() }).parse(params);
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const router = useRouter();

  const { mutateAsync: processCode } = api.auth.processCanvasCode.useMutation();

  const { data, isLoading, refetch } = api.canvas.loginDeets.useQuery({
    subdomain,
  });

  const linkParams = useMemo(() => {
    if (!data) {
      return null;
    }
    const sp = new URLSearchParams();
    sp.append("client_id", data.clientId);
    sp.append("response_type", "code");
    sp.append("state", state);
    sp.append("redirect_uri", getRedirectUrl(subdomain));
    return sp.toString();
  }, [data, subdomain]);

  useEffect(() => {
    if (!data || !code) {
      return;
    }
    void processCode({
      code,
      canvasIntegrationId: data.canvasIntegrationId,
    }).then(() => {
      router.push("/activities");
    });
  }, [data, code, processCode, router]);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!linkParams) {
    return <CreateIntegration subdomain={subdomain} onCreated={refetch} />;
  }

  return (
    <div>
      <h1>Canvas Login Page</h1>
      <a
        href={`${getCanvasBaseUrl(subdomain)}/login/oauth2/auth?${linkParams}`}
      >
        Login with Canvas
      </a>
    </div>
  );
}
