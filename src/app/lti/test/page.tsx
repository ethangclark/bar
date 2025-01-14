import React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ margin: "40px" }}>
      <h1>Welcome to the LTI 1.3 Tool Example</h1>
      <p>
        This tool demonstrates a minimal functional LTI 1.3 integration with key
        management, JWKS retrieval, and JWT validation.
      </p>
      <ul>
        <li>
          <Link href="/self-onboard">Self-Onboard Your LMS</Link>
        </li>
        <li>
          <Link href="/assignments">Create or View Assignments</Link>
        </li>
        <li>
          <Link href="/lti/login">Simulate LTI OIDC Login (Manual)</Link>
        </li>
      </ul>
    </div>
  );
}
