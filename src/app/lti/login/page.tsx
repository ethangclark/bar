"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { api } from "~/trpc/react";

export function LtiLoginPage() {
  // const router = useRouter();
  // const { iss, login_hint, lti_message_hint, lti_deployment_id } = router.query;
  const searchParams = useSearchParams();
  const iss = searchParams.get("iss");
  const login_hint = searchParams.get("login_hint");
  const lti_message_hint = searchParams.get("lti_message_hint");
  const lti_deployment_id = searchParams.get("lti_deployment_id");

  const initOidc = api.lti.initOidc.useMutation();

  // We could show a small UI or auto-redirect if all params are present.
  // For demonstration, let's show a button to "Start LTI Login".
  const handleLogin = async () => {
    if (!iss || !login_hint) {
      alert("Missing required parameters. Check logs.");
      return;
    }
    const result = await initOidc.mutateAsync({
      iss,
      login_hint,
      lti_message_hint,
      lti_deployment_id,
    });
    const { redirectUrl } = result;
    window.location.href = redirectUrl;
  };

  return (
    <div style={{ margin: "40px" }}>
      <h1>Simulate LTI OIDC Login Flow</h1>
      <p>issuer (iss): {iss}</p>
      <p>login_hint: {login_hint}</p>
      <p>lti_message_hint: {lti_message_hint}</p>
      <p>lti_deployment_id: {lti_deployment_id}</p>
      <br />
      <button onClick={handleLogin}>Start OIDC Login</button>
    </div>
  );
}
export default LtiLoginPage;
