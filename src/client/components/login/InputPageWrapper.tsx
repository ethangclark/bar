import { FrontPageLogo } from "../Logo";
import { NoScrollPage } from "../Page";

export function InputPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NoScrollPage>
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="mb-6">
          <FrontPageLogo />
        </div>
        {children}
      </div>
    </NoScrollPage>
  );
}
