const EVENT_NAME = "ai-soc:data-changed";

/** Signals that a mutation (decision, new investigation, report) succeeded so shared views can reload. */
export function notifyDataChanged(): void {
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function subscribeToDataChanges(listener: () => void): () => void {
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
