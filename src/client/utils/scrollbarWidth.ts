export const scrollbarWidth = (() => {
  if (typeof document === "undefined") {
    return 15;
  }
  const outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.width = "100px";
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  (outer.style as any).msOverflowStyle = "scrollbar"; // needed for WinJS apps

  document.body.appendChild(outer);

  const widthNoScroll = outer.offsetWidth;
  // force scrollbars
  outer.style.overflow = "scroll";

  // add innerdiv
  const inner = document.createElement("div");
  inner.style.width = "100%";
  outer.appendChild(inner);

  const widthWithScroll = inner.offsetWidth;

  // remove divs
  outer.parentNode?.removeChild(outer);

  return widthNoScroll - widthWithScroll;
})();

export const scrollbarHeight = (() => {
  if (typeof document === "undefined") {
    return 15;
  }
  const outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.height = "100px";
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  (outer.style as any).msOverflowStyle = "scrollbar"; // needed for WinJS apps

  document.body.appendChild(outer);

  const heightNoScroll = outer.offsetHeight;
  // force scrollbars (including horizontal)
  outer.style.overflow = "scroll";

  // add innerdiv to measure the content area's height
  const inner = document.createElement("div");
  inner.style.height = "100%";
  outer.appendChild(inner);

  const heightWithScroll = inner.offsetHeight;

  // cleanup
  outer.parentNode?.removeChild(outer);

  return heightNoScroll - heightWithScroll + 1; // +1 because empirically wasn't enough without it
})();
