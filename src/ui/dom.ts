// Small helpers that read the page the app is drawn on.

/** The nearest ancestor that scrolls (or the page itself). */
export function scrollerOf(el: HTMLElement): HTMLElement {
  for (let n = el.parentElement; n; n = n.parentElement) {
    const y = getComputedStyle(n).overflowY;
    if ((y === 'auto' || y === 'scroll') && n.scrollHeight > n.clientHeight) return n;
  }
  return (document.scrollingElement as HTMLElement) ?? document.documentElement;
}

/** The current theme's accent colour (the colour of the book's standard cover), as hex. */
export function themeAccent(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  return /^#[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : '#F3A3BA';
}
