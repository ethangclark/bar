import { Spin } from "antd";
import classnames from "classnames";
import { CheckCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { noop } from "~/common/fnUtils";
import { Centered } from "./Centered";
import { Page } from "./Page";

// not exported; should not use this directly
const Loading = () => <Spin />;

export const LoadingCentered = () => (
  <Centered>
    <Loading />
  </Centered>
);

export const LoadingNotCentered = () => <Loading />;

export function LoadingPage() {
  return (
    <Page>
      <LoadingCentered />
    </Page>
  );
}

// Shows a loading indicator when saving is happening + 500ms after,
// then shows a checkmark that fades out in a classy way.
export const FancySavingIndicator = ({
  saving: savingRaw,
}: {
  saving: boolean;
}) => {
  const [saving, setSaving] = useState(savingRaw);
  const [saved, setSaved] = useState(false);
  const savePaddingTimeout = useRef(setTimeout(noop));
  useEffect(() => {
    clearTimeout(savePaddingTimeout.current);
    setSaved(false);
    if (savingRaw) {
      setSaving(true);
    } else {
      savePaddingTimeout.current = setTimeout(() => {
        setSaving(false);
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
        }, 500);
      }, 500);
    }
  }, [savingRaw]);

  return (
    <div className="relative">
      <div className={saving ? "visible" : "invisible"}>
        <LoadingNotCentered />
      </div>
      <div
        className={classnames(
          "absolute inset-0 mt-1 flex items-center justify-center transition-opacity",
          {
            "opacity-100 duration-[0ms]": saved,
            "opacity-0 duration-[2000ms]": !saved,
            invisible: saving,
            visible: !saving,
          },
        )}
      >
        <CheckCircle size={16} />
      </div>
    </div>
  );
};
