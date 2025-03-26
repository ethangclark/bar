"use client";

import { Suspense } from "react";
import { Admin } from "~/client/admin/Admin";
import { LoadingPage } from "~/client/components/Loading";
import { NoScrollPage } from "~/client/components/Page";

export default function AdminPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <NoScrollPage>
        <Admin />
      </NoScrollPage>
    </Suspense>
  );
}
