import type { MouseEvent } from "react";

/** Blocks right-click save on artwork; still allows form fields and controls. */
export function preventArtworkContextMenu(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (
    target.closest(
      "textarea, input, select, [contenteditable='true'], a, button",
    )
  ) {
    return;
  }

  event.preventDefault();
}
