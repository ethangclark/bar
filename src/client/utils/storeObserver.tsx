import { observer } from "mobx-react-lite";
import { type BaseObject } from "~/common/baseObject";
import { type ComponentType } from "react";
import { type Stores, stores } from "./allStores";

export function storeObserver<P = BaseObject>(
  Component: ComponentType<P & Stores>,
): ComponentType<P> {
  const displayName =
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    Component.displayName || Component.name || "StoreObserver";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const InnerWrapped = observer(Component as any);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  InnerWrapped.displayName = displayName;
  const OuterWrapped = (props: P) => <InnerWrapped {...stores} {...props} />;
  OuterWrapped.displayName = displayName;
  return OuterWrapped;
}
