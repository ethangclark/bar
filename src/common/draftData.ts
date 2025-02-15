// could add some sort of fancy signature here so it's obvious when viewing...
export const getDraftId = () => crypto.randomUUID();

// one day in the future just to ensure that there's never overlap with e.g. database system time
// (this should be overwritten by the server for creates/updates)
export const getDraftDate = () => new Date(Date.now() + 1000 * 60 * 60 * 24);

// heh
// (must be overridden by the server for creates/updates)
export const draftNumericId = -1;
