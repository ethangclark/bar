export abstract class Status {
  ___isStatus?: true; // typescript can't handle truly-empty objects/classes
}

export class NotLoaded extends Status {}
export const notLoaded = new NotLoaded();

export class Loading extends Status {}
export const loading = new Loading();

export class Reloading extends Loading {}
export const reloading = new Reloading();

export class NotFound extends Status {}
export const notFound = new NotFound();

export type Data<T> = T extends Status | infer U ? U : never;

export function statusCast<T>(
  maybeStatus: T,
  ifStatus: T extends Status ? never : T,
) {
  return maybeStatus instanceof Status ? ifStatus : maybeStatus;
}
