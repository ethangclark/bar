import { autorun, makeAutoObservable } from "mobx";
import { notLoaded, Status, type NotLoaded } from "~/client/utils/status";
import { type ViewMode } from "~/common/searchParams";
import { type UserBasic } from "~/common/types";
import { type LocationStore } from "./locationStore";
import { type ViewModeStore } from "./viewModeStore";

function isSupportedLocation({
  pathname,
  viewMode,
}: {
  pathname: string;
  viewMode: ViewMode;
}) {
  if (
    /^\/activity\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      pathname,
    )
  ) {
    return viewMode === "doer";
  }
  return false;
}

export class UserStore {
  // this is the "for realsies" userId
  private _user: UserBasic | NotLoaded = notLoaded;
  private _impersonating: UserBasic | null = null;

  constructor(
    private locationStore: LocationStore,
    private viewModeStore: ViewModeStore,
  ) {
    makeAutoObservable(this);

    // get rid of impersonation cache if we navigate to a location that doesn't support it
    let lastWasSupported = false;
    autorun(() => {
      if (this.viewModeStore.viewMode instanceof Status) {
        return;
      }
      const isSupported = isSupportedLocation({
        pathname: this.locationStore.pathname,
        viewMode: this.viewModeStore.viewMode,
      });
      if (lastWasSupported && !isSupported) {
        this._impersonating = null;
      }
      lastWasSupported = isSupported;
    });
  }

  get impersonating() {
    if (this.viewModeStore.viewMode instanceof Status) {
      return null;
    }
    if (
      isSupportedLocation({
        pathname: this.locationStore.pathname,
        viewMode: this.viewModeStore.viewMode,
      })
    ) {
      return this._impersonating;
    }
    return null;
  }

  public get user() {
    if (this.impersonating !== null) {
      return this.impersonating;
    }
    return this._user;
  }

  setUser(user: UserBasic) {
    this._user = user;
  }

  impersonateUser(user: UserBasic) {
    this._impersonating = user;
  }

  stopImpersonating() {
    this._impersonating = null;
  }
}
