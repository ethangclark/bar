import { makeAutoObservable } from "mobx";
import { objectEntries } from "~/common/objectUtils";
import { searchParamsX, type SearchParamsX } from "~/common/searchParams";

export class LocationStore {
  // dummy observable to force MobX to re-read URL state
  private version = 0;

  constructor() {
    makeAutoObservable(this);
    if (typeof window !== "undefined") {
      // update observable when the browser history changes
      window.addEventListener("popstate", this.handlePopState);
    }
  }

  private handlePopState = () => {
    this.version++;
  };

  // Returns the current pathname from the URL
  get pathname() {
    if (typeof window === "undefined") return "";
    return new URL(window.location.href).pathname;
  }

  // Returns a SearchParams object based on the URL search parameters.
  // Reads the dummy observable `version` so MobX reacts to URL changes.
  get searchParams(): SearchParamsX {
    if (typeof window === "undefined") return {};
    // Access version to trigger recomputation when it changes
    void this.version;
    const url = new URL(window.location.href);
    const params: SearchParamsX = {};

    objectEntries(searchParamsX).forEach(([name, { key, schema }]) => {
      const val = url.searchParams.get(key);
      if (val !== null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        params[name] = schema.parse(decodeURIComponent(val)) as any;
      }
    });

    return params;
  }

  // Sets a search parameter in the URL. The value is stringified and encoded.
  setSearchParam(
    name: keyof SearchParamsX,
    value: SearchParamsX[keyof SearchParamsX],
  ) {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);

    if (value === undefined || value === null) {
      url.searchParams.delete(searchParamsX[name].key);
    } else {
      // Encode the value manually
      url.searchParams.set(searchParamsX[name].key, encodeURIComponent(value));
    }

    // Update URL without reloading; pushState accepts full URL as long as it's same-origin.
    window.history.pushState(null, "", url.toString());
    this.version++;
  }

  // Deletes a search parameter from the URL.
  deleteSearchParam(name: keyof SearchParamsX) {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete(searchParamsX[name].key);
    window.history.pushState(null, "", url.toString());
    this.version++;
  }
}
