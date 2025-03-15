import { assertTypesExhausted } from "~/common/assertions";
import { allIntegrationTypes } from "~/common/types";
import { ConnectToCanvas } from "./ConnectToCanvas";

export function ConnectIntegrationButtons() {
  return (
    <div className="flex w-full justify-center gap-4">
      {allIntegrationTypes.map((it) => {
        switch (it) {
          case "canvas":
            return <ConnectToCanvas key={it} />;
          default:
            assertTypesExhausted(it);
        }
      })}
    </div>
  );
}
