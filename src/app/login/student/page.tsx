"use client";

import { Suspense } from "react";
import { LoadingPage } from "~/client/components/Loading";
import { LoginPage } from "~/client/components/LoginPage";

export default function LogInStudent() {
  return (
    // I hate Next.js
    <Suspense fallback={<LoadingPage />}>
      <LoginPage />
    </Suspense>
  );
}
