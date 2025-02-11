// TODO: audit use of these and maybe rename

export function baseToId(idBase: number) {
  return idBase + 1000;
}

export function idToBase(id: number) {
  return id - 1000;
}
