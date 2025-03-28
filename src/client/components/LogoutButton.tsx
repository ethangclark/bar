import { Button } from "antd";
import { useState } from "react";
import { trpc } from "~/trpc/proxy";
import { LoadingNotCentered } from "./Loading";

export function LogoutButton({ flushRight }: { flushRight: boolean }) {
  const [loggingOut, setLoggingOut] = useState(false);
  return (
    <div className={`relative ${flushRight ? "mr-[-16px]" : ""}`}>
      <Button
        type="text"
        className={`padding-0 ${loggingOut ? "invisible" : "visible"}`}
        onClick={async () => {
          void trpc.auth.logout.mutate().then(() => {
            window.location.href = "/";
          });
          setTimeout(() => {
            setLoggingOut(true);
          }, 500);
        }}
      >
        Log out
      </Button>
      <div
        className={`absolute inset-0 flex items-center justify-center ${loggingOut ? "visible" : "invisible"}`}
      >
        <LoadingNotCentered />
      </div>
    </div>
  );
}
