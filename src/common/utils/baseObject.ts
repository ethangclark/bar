// typescript can't handle truly-empty objects/classes
export type BaseObject = {
  ___isBaseObject?: true;
};
