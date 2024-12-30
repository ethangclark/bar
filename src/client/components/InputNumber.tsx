import { Input } from "antd";
import { type ChangeEvent, useState, useCallback, useEffect } from "react";

export function InputNumber({
  value: propValue,
  onChange,
  onValidityChange,
  width,
  addonBefore,
  addonAfter,
}: {
  value: number;
  onChange: (v: number) => void;
  onValidityChange: (valid: boolean) => void;
  width?: number | undefined;
  addonBefore?: string | undefined;
  addonAfter?: string | undefined;
}) {
  const [valid, setValid] = useState(true);
  const [internalValue, setInternalValue] = useState(() =>
    propValue.toString(),
  );
  const [lastSetTo, setLastSetTo] = useState(propValue);
  useEffect(() => {
    if (propValue !== lastSetTo) {
      setInternalValue(propValue.toString());
      setLastSetTo(propValue);
      if (!valid) {
        setValid(true);
        onValidityChange(true);
      }
    }
  }, [propValue, lastSetTo, valid, onValidityChange]);

  const wrappedOnChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      const n = parseFloat(e.target.value);
      if (n.toString() !== e.target.value.trim()) {
        if (valid) {
          setValid(false);
          onValidityChange(false);
        }
      } else {
        if (!valid) {
          setValid(true);
          onValidityChange(true);
        }
        onChange(n);
        setLastSetTo(n);
      }
    },
    [onChange, onValidityChange, valid],
  );

  return (
    <Input
      value={internalValue}
      onChange={wrappedOnChange}
      style={{ width }}
      status={valid ? undefined : "error"}
      addonBefore={addonBefore}
      addonAfter={addonAfter}
    />
  );
}
