import { makeAutoObservable } from "mobx";
import { objectEntries } from "~/common/objectUtils";
import {
  type SearchParamName,
  searchParamsX,
  type SearchParamsX,
} from "~/common/searchParams";

export class LocationStore {
  // dummy observable to force MobX to re-read URL state
  private pathnameVersion = 0;
  private searchParamVersion = 0;

  constructor() {
    makeAutoObservable(this);
  }

  _onPathnameChange() {
    this.pathnameVersion++;
  }

  _onSearchParamChange() {
    this.searchParamVersion++;
  }

  // Returns the current pathname from the URL
  get pathname() {
    if (typeof window === "undefined") return "";
    // Access version to trigger recomputation when it changes
    void this.pathnameVersion;
    return new URL(window.location.href).pathname;
  }

  // Returns a SearchParams object based on the URL search parameters.
  // Reads the dummy observable `version` so MobX reacts to URL changes.
  get searchParams(): SearchParamsX {
    if (typeof window === "undefined") return {};
    // Access version to trigger recomputation when it changes
    void this.searchParamVersion;
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

  searchParam<T extends SearchParamName>(name: T): SearchParamsX[T] {
    return this.searchParams[name];
  }

  // Sets a search parameter in the URL. The value is stringified and encoded.
  setSearchParam<T extends SearchParamName>(name: T, value: SearchParamsX[T]) {
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
    this.searchParamVersion++;
  }

  // Deletes a search parameter from the URL.
  deleteSearchParam(name: SearchParamName) {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.delete(searchParamsX[name].key);
    window.history.pushState(null, "", url.toString());
    this.searchParamVersion++;
  }
}
