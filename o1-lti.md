Here's o1's example:

```
/************************************************************************************************
 *  package.json (Illustrative)
 ***********************************************************************************************/
{
  "name": "my-lti13-tool",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "13.x",
    "react": "18.x",
    "react-dom": "18.x",
    "jsonwebtoken": "^9.0.0",
    "jwks-rsa": "^2.1.3",
    "node-jose": "^2.0.0"
  }
}

/************************************************************************************************
 *  next.config.js
 ***********************************************************************************************/
module.exports = {
  reactStrictMode: true,
};

/************************************************************************************************
 *  pages/_app.js
 ***********************************************************************************************/
import React from 'react';

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;

/************************************************************************************************
 *  A. UTILS: cryptographic helpers (we place these here for demonstration, 
 *     in real usage put them in /lib or /utils folder).
 ***********************************************************************************************/
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import * as jose from 'node-jose';

/**
 * Caches a jwksClient per issuer so we don't re-instantiate repeatedly.
 */
const issuerToJwksClientMap = new Map();

/**
 * Return a jwks-rsa client for the given JWKS URL.
 */
function getJwksClient(jwksUri) {
  if (!issuerToJwksClientMap.has(jwksUri)) {
    issuerToJwksClientMap.set(jwksUri, jwksClient({ jwksUri }));
  }
  return issuerToJwksClientMap.get(jwksUri);
}

/**
 * Retrieve the LMS’s public key (PEM) to verify an id_token. 
 * We do this by examining the `kid` (Key ID) in the JWT header, 
 * then fetching that key from the LMS’s JWKS endpoint.
 */
async function getSigningKey(jwksUri, kid) {
  const client = getJwksClient(jwksUri);
  const key = await client.getSigningKeyAsync(kid);
  return key.getPublicKey(); // PEM-format public key
}

/**
 * Validate the LTI 1.3 id_token from the LMS. 
 * Checks signature via JWKS, issuer, audience, etc.
 *
 * @param {string} idToken The JWT from the LMS
 * @param {string} expectedIssuer e.g. "https://canvas.example.com" 
 * @param {string} expectedAudience The tool's client_id from the LMS
 * @param {string} jwksUrl Where to fetch the LMS’s JWKS
 * @returns {object} The decoded token if valid
 */
export async function validateLtiIdToken(idToken, expectedIssuer, expectedAudience, jwksUrl) {
  if (!idToken) throw new Error('Missing id_token');

  // Decode header to get "kid"
  const decodedHeader = jwt.decode(idToken, { complete: true });
  if (!decodedHeader || !decodedHeader.header) {
    throw new Error('Invalid JWT header');
  }
  const { kid } = decodedHeader.header;
  if (!kid) {
    throw new Error('No "kid" found in JWT header');
  }

  // Retrieve the PEM public key from JWKS
  const publicKey = await getSigningKey(jwksUrl, kid);

  // Verify signature and claims
  let verifiedToken;
  try {
    verifiedToken = jwt.verify(idToken, publicKey, {
      algorithms: ['RS256'], // LTI 1.3 typically uses RS256
      issuer: expectedIssuer,
      audience: expectedAudience,
    });
  } catch (err) {
    throw new Error('JWT Verification failed: ' + err.message);
  }

  return verifiedToken;
}

/**
 * In some LTI 1.3 flows, the Tool needs to call the LMS’s service endpoints 
 * (e.g. to pass back grades). Tools typically must sign an OAuth2 client_assertion 
 * with a private key. 
 *
 * This function signs a JWT for that purpose.
 *
 * @param {string} issuer The tool’s identifier (often the tool’s client_id)
 * @param {string} audience The LMS’s token endpoint
 * @param {object} privateKeyObj A Node-Jose key object of your private key
 * @returns {string} A signed JWT
 */
export async function signClientAssertion(issuer, audience, privateKeyObj) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 300; // 5 minutes

  const payload = {
    iss: issuer,
    sub: issuer,
    aud: audience,
    iat,
    exp,
    jti: Math.random().toString(36).substring(2),
  };

  // Using node-jose to sign
  const raw = await jose.JWS.createSign(
    { format: 'compact', alg: 'RS256' },
    privateKeyObj
  )
    .update(Buffer.from(JSON.stringify(payload)))
    .final();

  return raw;
}

/**
 * Example: generate or load your own private key for signing. 
 * Real usage: store a stable key in your DB or environment variables. 
 * This function demonstrates generating a new one each time (not recommended in production).
 */
let cachedToolPrivateKey = null;
let cachedToolPublicKeyPem = null;

export async function getOrCreateToolKeyPair() {
  if (cachedToolPrivateKey && cachedToolPublicKeyPem) {
    return { privateKey: cachedToolPrivateKey, publicKeyPem: cachedToolPublicKeyPem };
  }
  // Generate a 2048-bit RSA key (for demonstration only).
  // In production, you might read from a file, env var, or store in secure vault.
  const keyStore = jose.JWK.createKeyStore();
  const key = await keyStore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' });
  cachedToolPrivateKey = key; // This is a node-jose Key object
  cachedToolPublicKeyPem = key.toPEM(false); // public only
  return { privateKey: cachedToolPrivateKey, publicKeyPem: cachedToolPublicKeyPem };
}

/************************************************************************************************
 *  B. Example In-Memory State for OIDC
 *  We store ephemeral state/nonce for demonstration. 
 *  In production, store in a DB or encrypted session cookie.
 ***********************************************************************************************/
const OIDC_STATE_CACHE = new Map();

/************************************************************************************************
 *  pages/index.js 
 ***********************************************************************************************/
import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ margin: '40px' }}>
      <h1>Welcome to the LTI 1.3 Tool Example</h1>
      <p>
        This tool demonstrates a minimal functional LTI 1.3 integration with key management, 
        JWKS retrieval, and JWT validation.
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

/************************************************************************************************
 *  pages/self-onboard.js
 *  A form so an LMS admin can register their platform details 
 *  (issuer, clientId, deploymentId, authEndpoint, jwksUrl).
 ***********************************************************************************************/
import React, { useState } from 'react';

export function SelfOnboardPage() {
  const [institutionName, setInstitutionName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [clientId, setClientId] = useState('');
  const [deploymentId, setDeploymentId] = useState('');
  const [authEndpoint, setAuthEndpoint] = useState('');
  const [jwksUrl, setJwksUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/self-onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institutionName,
        issuer,
        clientId,
        deploymentId,
        authEndpoint,
        jwksUrl,
      }),
    });
    if (res.ok) {
      alert('Institution onboarded!');
    } else {
      alert('Error saving institution details.');
    }
  };

  return (
    <div style={{ margin: '40px' }}>
      <h1>Self-Onboard an LTI 1.3 LMS</h1>
      <form onSubmit={handleSubmit} style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
        <label>Institution Name:</label>
        <input value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} />

        <label>Issuer (iss):</label>
        <input value={issuer} onChange={(e) => setIssuer(e.target.value)} />

        <label>Client ID:</label>
        <input value={clientId} onChange={(e) => setClientId(e.target.value)} />

        <label>Deployment ID:</label>
        <input value={deploymentId} onChange={(e) => setDeploymentId(e.target.value)} />

        <label>Authorization Endpoint:</label>
        <input value={authEndpoint} onChange={(e) => setAuthEndpoint(e.target.value)} />

        <label>JWKS URL:</label>
        <input value={jwksUrl} onChange={(e) => setJwksUrl(e.target.value)} />

        <br />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
export default SelfOnboardPage;

/************************************************************************************************
 *  pages/assignments.js
 ***********************************************************************************************/
import React, { useState, useEffect } from 'react';

export function AssignmentsPage() {
  const [title, setTitle] = useState('');
  const [maxScore, setMaxScore] = useState(100);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetch('/api/assignments')
      .then((res) => res.json())
      .then((data) => setAssignments(data.assignments || []))
      .catch((err) => console.error('Error fetching assignments:', err));
  }, []);

  const createAssignment = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, maxScore }),
    });
    if (res.ok) {
      const data = await res.json();
      setAssignments((prev) => [...prev, data.assignment]);
      alert('Assignment created!');
    } else {
      alert('Error creating assignment');
    }
  };

  return (
    <div style={{ margin: '40px' }}>
      <h1>Assignments</h1>
      <form onSubmit={createAssignment} style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
        <label>Assignment Title:</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />

        <label>Max Score:</label>
        <input type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
        <br />
        <button type="submit">Create Assignment</button>
      </form>

      <hr />
      <h2>Existing Assignments</h2>
      <ul>
        {assignments.map((a) => (
          <li key={a.id}>
            {a.title} (Max Score: {a.maxScore})
          </li>
        ))}
      </ul>
    </div>
  );
}
export default AssignmentsPage;

/************************************************************************************************
 *  pages/lti/login.js
 *  1) The LMS does "third-party initiated login" => user arrives here with iss, login_hint, etc.
 *  2) We look up the LMS info from DB, generate state/nonce, then redirect to LMS authEndpoint.
 ***********************************************************************************************/
import React from 'react';
import { useRouter } from 'next/navigation';

export function LtiLoginPage() {
  const router = useRouter();
  const { iss, login_hint, lti_message_hint, lti_deployment_id } = router.query;

  // We could show a small UI or auto-redirect if all params are present.
  // For demonstration, let's show a button to "Start LTI Login".
  const handleLogin = async () => {
    // 1. We'll call an API route that sets up the OIDC request
    //    and returns a redirect URL. Then we do window.location = that URL.
    try {
      const res = await fetch('/api/lti/oidc-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iss, login_hint, lti_message_hint, lti_deployment_id }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert('No redirect URL from server. Check logs.');
      }
    } catch (err) {
      console.error('Error initiating OIDC login:', err);
    }
  };

  return (
    <div style={{ margin: '40px' }}>
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

/************************************************************************************************
 *  pages/lti/launch.js
 *  The LMS will redirect here (or post here) with an id_token.
 *  We'll validate the token and show the user that they've successfully launched.
 ***********************************************************************************************/
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateLtiIdToken } from '../../_app'; // Using the cryptographic utils from above (monolithic example).

export default function LtiLaunchPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Validating...');
  const [decodedToken, setDecodedToken] = useState(null);
  const { id_token, state } = router.query; // Typically via query or POST body

  useEffect(() => {
    async function handleLaunch() {
      if (!id_token) {
        setStatus('No id_token found. Is this a real LTI launch?');
        return;
      }
      try {
        // In a real app, we’d look up the expected issuer/client ID from the DB 
        // using the state or your stored session. For example:
        // const { iss, jwksUrl, clientId } = await db.query(...) 
        // Hardcoding for illustration:
        const iss = 'https://example-lms.com';
        const jwksUrl = 'https://example-lms.com/.well-known/jwks.json';
        const clientId = '12345';

        // Validate:
        const verified = await validateLtiIdToken(id_token, iss, clientId, jwksUrl);
        setDecodedToken(verified);
        setStatus('LTI Launch Validated Successfully!');
      } catch (err) {
        setStatus('Error validating launch: ' + err.message);
      }
    }
    handleLaunch();
  }, [id_token]);

  return (
    <div style={{ margin: '40px' }}>
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

/************************************************************************************************
 *  pages/api/lti/oidc-init.js
 *  This API route is called by our /lti/login page to set up the OIDC Auth request 
 *  and provide a redirect URL to the LMS’s auth endpoint.
 ***********************************************************************************************/
export default async function oidcInitHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { iss, login_hint, lti_message_hint, lti_deployment_id } = req.body;
  if (!iss || !login_hint) {
    return res.status(400).json({ error: 'Missing required params: iss, login_hint' });
  }

  try {
    // We’d look up the LMS config from DB by `iss`:
    // e.g. const row = await db.query('SELECT * FROM institutions WHERE issuer = ...')
    // Hardcoding for demonstration:
    const clientId = '12345';
    const authEndpoint = 'https://example-lms.com/auth'; 
    const redirectUri = 'http://localhost:3000/lti/launch';

    // Generate state & nonce for OIDC
    const state = Math.random().toString(36).substring(7);
    const nonce = Math.random().toString(36).substring(7);

    // Save state & nonce in ephemeral cache so we can validate them later.
    OIDC_STATE_CACHE.set(state, { iss, clientId, lti_deployment_id, nonce });

    // Build the redirect URL to the LMS’s auth endpoint:
    const params = new URLSearchParams({
      response_type: 'id_token',
      scope: 'openid',
      client_id: clientId,
      redirect_uri: redirectUri,
      login_hint,
      state,
      nonce,
    });
    // If we have lti_message_hint or lti_deployment_id, we can pass them too:
    if (lti_message_hint) params.set('lti_message_hint', lti_message_hint);
    if (lti_deployment_id) params.set('lti_deployment_id', lti_deployment_id);

    const redirectUrl = `${authEndpoint}?${params.toString()}`;

    return res.status(200).json({ redirectUrl });
  } catch (err) {
    console.error('oidcInitHandler error:', err);
    return res.status(500).json({ error: err.message });
  }
}

/************************************************************************************************
 *  pages/api/self-onboard.js
 ***********************************************************************************************/
export async function selfOnboardHandler(req, res) {
  if (req.method === 'POST') {
    const { institutionName, issuer, clientId, deploymentId, authEndpoint, jwksUrl } = req.body;

    try {
      // Example DB save:
      await db.query(/*sql*/ `
        INSERT INTO institutions 
          (name, issuer, client_id, deployment_id, auth_endpoint, jwks_url)
        VALUES 
          ('${institutionName}', '${issuer}', '${clientId}', '${deploymentId}', '${authEndpoint}', '${jwksUrl}')
        ON DUPLICATE KEY UPDATE
          name='${institutionName}',
          client_id='${clientId}',
          auth_endpoint='${authEndpoint}',
          jwks_url='${jwksUrl}'
      `);

      return res.status(200).json({ message: 'Onboarded successfully.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'DB error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
export default selfOnboardHandler;

/************************************************************************************************
 *  pages/api/assignments.js
 ***********************************************************************************************/
export async function assignmentsApiHandler(req, res) {
  if (req.method === 'GET') {
    try {
      const rows = await db.query('SELECT * FROM assignments');
      return res.status(200).json({ assignments: rows });
    } catch (err) {
      return res.status(500).json({ error: 'DB error' });
    }
  } else if (req.method === 'POST') {
    const { title, maxScore } = req.body;
    try {
      const result = await db.query(/*sql*/ `
        INSERT INTO assignments (title, max_score) 
        VALUES ('${title}', '${maxScore}') 
        RETURNING id, title, max_score
      `);
      const assignment = result[0];
      return res.status(200).json({
        message: 'Assignment created',
        assignment: {
          id: assignment.id,
          title: assignment.title,
          maxScore: assignment.max_score,
        },
      });
    } catch (err) {
      return res.status(500).json({ error: 'DB error' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
export default assignmentsApiHandler;

/************************************************************************************************
 *  pages/api/generate-score.js
 ***********************************************************************************************/
export async function generateScoreHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const randomScore = (Math.random() * 100).toFixed(2);
  return res.status(200).json({ score: randomScore });
}
export default generateScoreHandler;

/************************************************************************************************
 *  pages/api/lti/outcome.js
 ***********************************************************************************************/
export async function outcomeHandler(req, res) {
  if (req.method === 'POST') {
    const { userId, assignmentId, score } = req.body;
    // In real usage, do LMS grade passback with a client assertion 
    // signed by your private key (see signClientAssertion).
    console.log('Received outcome request:', { userId, assignmentId, score });
    return res.status(200).json({ message: 'Score accepted. (Dummy endpoint)' });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
export default outcomeHandler;
```
