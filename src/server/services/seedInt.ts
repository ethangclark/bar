/*
TODO: replace with something fancy that uses values 231000-999999,
tracking what has been used,
then 1000000 - 9999999 once those are used up,
then 10000000 - 99999999, etc.
using valueId as the ID in a table
*/
export async function createSeedInt() {
  const valueId = Math.floor(Math.random() * 1000000);
  return valueId;
}
