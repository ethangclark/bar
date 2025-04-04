"use client";

import { Suspense } from "react";
import { LoadingPage } from "~/client/components/Loading";
import { LoginPage } from "~/client/components/login/LoginPage";

export default function GeneralLoginPage() {
  return (
    // I hate Next.js
    <Suspense fallback={<LoadingPage />}>
      <LoginPage />
    </Suspense>
  );
}
