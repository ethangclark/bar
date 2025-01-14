"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ClientOnly } from "~/client/components/ClientOnly";

// const key = "7hFnty7P6aQxZk9v6LDnPm9t2ZATYKDYctCT84F8uk9rKxAmZHADGVfPvEehxmkA";
const clientId = "10000000000001";
const state = Math.random().toString(36).substring(7); // could generate this legitimately + compare it in searchParams when invoked as callback

const linkParams = new URLSearchParams();
linkParams.append("client_id", clientId);
linkParams.append("response_type", "code");
linkParams.append("state", state);
linkParams.append("redirect_uri", "http://localhost:4000/login/canvas");

const Impl = () => {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  useEffect(() => {
    if (code) {
      console.log({ code });
    }
  }, [code]);

  return (
    <ClientOnly>
      <div>
        <h1>Canvas Login Page</h1>
        <a
          href={`http://localhost:3000/login/oauth2/auth?${linkParams.toString()}`}
        >
          Login with Canvas
        </a>
      </div>
    </ClientOnly>
  );
};

export default function CanvasLoginPage() {
  return <Impl />;
}
