export const baseObject = { ___isBaseObject: true as const }; // typescript can't handle truly-empty objects/classes
export type BaseObject = typeof baseObject;
