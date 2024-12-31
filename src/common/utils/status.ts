export abstract class Status {
  ___isStatus = true; // typescript can't handle truly-empty objects/classes
}

export class NeverLoaded extends Status {}
export const neverLoaded = new NeverLoaded();

export class Loading extends Status {}
export const loading = new Loading();

// each type of data that we want to represent as stalely-cacheable
// should have its own class that extends Status
export function ReloadingStatus<T>() {
  return class Reloading extends Status {
    constructor(public staleData: T) {
      super();
    }
  };
}

export class NotFound extends Status {}
export const notFound = new NotFound();

export type Data<T> = T extends Status | infer U ? U : never;
