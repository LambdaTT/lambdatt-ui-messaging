/**
 * State machine for the mobile conversations drawer (ChatScreen sidebar).
 * Pure functions — no Vue/DOM — so they're unit-testable without a
 * component-mounting harness.
 */

export function toggleDrawer(isOpen) {
  return !isOpen
}

export function shouldAutoCloseOnSelect(isMobile) {
  return isMobile === true
}
