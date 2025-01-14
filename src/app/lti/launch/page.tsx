"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { validateLtiIdToken } from "~/server/utils/cryptoUtils";
import { assertIsError } from "~/common/utils/errorUtils";
import { type JwtPayload } from "jsonwebtoken";

export default function LtiLaunchPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Validating...");
  const [decodedToken, setDecodedToken] = useState<string | JwtPayload | null>(
    null,
  );
  // const { id_token: idToken /*, state*/ } = router.query; // Typically via query or POST body
  const idToken = searchParams.get("id_token");
  // const state = searchParams.get("state");

  useEffect(() => {
    async function handleLaunch() {
      if (!idToken || Array.isArray(idToken)) {
        setStatus("No id_token found. Is this a real LTI launch?");
        return;
      }
      try {
        // In a real app, we’d look up the expected issuer/client ID from the DB
        // using the state or your stored session. For example:
        // const { iss, jwksUrl, clientId } = await db.query(...)
        // Hardcoding for illustration:
        const iss = "https://example-lms.com";
        const jwksUrl = "https://example-lms.com/.well-known/jwks.json";
        const clientId = "12345";
        if (1) {
          throw new Error(
            "NOT YET IMPLEMENTED; should this be referencing the same state saved in OIDC_STATE_CACHE in o1-lti.md?",
          );
        }

        // Validate:
        const verified = await validateLtiIdToken({
          idToken: idToken,
          expectedIssuer: iss,
          expectedAudience: clientId,
          jwksUrl,
        });
        setDecodedToken(verified);
        setStatus("LTI Launch Validated Successfully!");
      } catch (err) {
        assertIsError(err);
        setStatus("Error validating launch: " + err.message);
      }
    }
    void handleLaunch();
  }, [idToken]);

  return (
    <div style={{ margin: "40px" }}>
      <h1>LTI Launch</h1>
      <p>Status: {status}</p>
      {decodedToken && (
        <>
          <h3>Decoded id_token:</h3>
          <pre>{JSON.stringify(decodedToken, null, 2)}</pre>
        </>
      )}
    </div>
  );
}
