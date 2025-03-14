"use client";

import { Suspense } from "react";
import { LoadingPage } from "../Loading";
import { ErrorDisplayProvider } from "./ErrorDisplayProvider";
import { HmrDejankProvider } from "./HmrDejankProvider";
import { LocationProvider } from "./LocationProvider";

const CustomProvidersImpl = ({ children }: { children: React.ReactNode }) => {
  return (
    <HmrDejankProvider>
      <LocationProvider>
        <ErrorDisplayProvider>{children}</ErrorDisplayProvider>
      </LocationProvider>
    </HmrDejankProvider>
  );
};

export const CustomProviders = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <Suspense fallback={<LoadingPage />}>
      <CustomProvidersImpl>{children}</CustomProvidersImpl>
    </Suspense>
  );
};
