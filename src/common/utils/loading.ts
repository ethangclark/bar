export abstract class LoadStatus {
  ___isLoadStatus = true; // typescript can't handle truly-empty objects/classes
}

export class NeverLoaded extends LoadStatus {}
export const neverLoaded = new NeverLoaded();

export class Loading extends LoadStatus {}
export const loading = new Loading();

// // rather than a generic Reloading class,
// // we should create specific Reloading classes
// // for each data type we want to be able to represent as stale-and-reloading
// // so we can do realtime instanceof checks
// export class Reloading<T> extends Loading {
//   constructor(public staleData: T) {
//     super();
//   }
// }

export class NotFound extends LoadStatus {}
export const notFound = new NotFound();

export type Loaded<T> = T extends LoadStatus | infer U ? U : never;
