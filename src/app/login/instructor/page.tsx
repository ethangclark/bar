"use client";

import { Suspense } from "react";
import { LoadingPage } from "~/client/components/Loading";
import { LoginPage } from "~/client/components/login/LoginPage";

export default function LogInInstructor() {
  return (
    // I hate Next.js
    <Suspense fallback={<LoadingPage />}>
      <LoginPage forInstructor />
    </Suspense>
  );
}
