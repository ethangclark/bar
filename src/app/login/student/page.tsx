"use client";

import { Suspense } from "react";
import { LoadingCentered } from "~/client/components/Loading";
import { LoginPage } from "~/client/components/LoginPage";

export default function LogInStudent() {
  return (
    // I hate Next.js
    <Suspense fallback={<LoadingCentered />}>
      <LoginPage />
    </Suspense>
  );
}
