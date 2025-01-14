"use client";

import React, { useState } from "react";
import { api } from "~/trpc/react";

export function SelfOnboardPage() {
  const [institutionName, setInstitutionName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [clientId, setClientId] = useState("");
  const [deploymentId, setDeploymentId] = useState("");
  const [authEndpoint, setAuthEndpoint] = useState("");
  const [jwksUrl, setJwksUrl] = useState("");

  const selfOnboard = api.lti.selfOnboard.useMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await selfOnboard.mutateAsync({
      institutionName,
      issuer,
      clientId,
      deploymentId,
      authEndpoint,
      jwksUrl,
    }),
      alert("Institution onboarded!");
  };

  return (
    <div style={{ margin: "40px" }}>
      <h1>Self-Onboard an LTI 1.3 LMS</h1>
      <form
        onSubmit={handleSubmit}
        style={{ width: "400px", display: "flex", flexDirection: "column" }}
      >
        <label>Institution Name:</label>
        <input
          value={institutionName}
          onChange={(e) => setInstitutionName(e.target.value)}
        />

        <label>Issuer (iss):</label>
        <input value={issuer} onChange={(e) => setIssuer(e.target.value)} />

        <label>Client ID:</label>
        <input value={clientId} onChange={(e) => setClientId(e.target.value)} />

        <label>Deployment ID:</label>
        <input
          value={deploymentId}
          onChange={(e) => setDeploymentId(e.target.value)}
        />

        <label>Authorization Endpoint:</label>
        <input
          value={authEndpoint}
          onChange={(e) => setAuthEndpoint(e.target.value)}
        />

        <label>JWKS URL:</label>
        <input value={jwksUrl} onChange={(e) => setJwksUrl(e.target.value)} />

        <br />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
export default SelfOnboardPage;
