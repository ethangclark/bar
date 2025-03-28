import { autorun, makeAutoObservable } from "mobx";
import {
  isStatus,
  notLoaded,
  Status,
  type NotLoaded,
} from "~/client/utils/status";
import { invoke } from "~/common/fnUtils";
import { type ViewMode } from "~/common/searchParams";
import { type UserBasic } from "~/common/types";
import { trpc } from "~/trpc/proxy";
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

  get rootIsAdmin() {
    if (isStatus(this._user)) {
      return this._user;
    }
    return this._user.isAdmin;
  }

  constructor(
    private locationStore: LocationStore,
    private viewModeStore: ViewModeStore,
  ) {
    makeAutoObservable(this);

    // get rid of impersonation cache if we navigate to a location that doesn't support it
    let lastWasSupported = false;
    autorun(() => {
      if (isStatus(this.rootIsAdmin) || this.rootIsAdmin) {
        return;
      }
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

    void invoke(async () => {
      const { user } = await trpc.auth.basicSessionDeets.query();
      if (user && this._user instanceof Status) {
        this.setUser(user);
      }
    });
  }

  get impersonating() {
    // admin gets to impersonate wherever they want
    if (this.rootIsAdmin === true) {
      return this._impersonating;
    }

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
