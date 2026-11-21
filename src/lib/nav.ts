/** Counts client-side route changes, so "Back" knows whether there is an in-store page to return to. */
let navigations = 0;
export const markNavigation = () => {
  navigations += 1;
};
export const hasInternalHistory = () => navigations > 1;
