import { type ReactNode } from "react";
import { Logo, LogoText } from "./Logo";
import { Page } from "./Page";

export function BigTitlePage({ children }: { children: ReactNode }) {
  return (
    <Page>
      <div className="mb-5 flex flex-col items-center">
        <div className="flex items-center">
          <Logo height={50} />
          <LogoText className="text-4xl md:text-6xl" />
        </div>
        <h1 className="text-lg font-bold md:text-2xl">
          February 2025 Bar Exam Prep
        </h1>
      </div>
      {children}
    </Page>
  );
}
