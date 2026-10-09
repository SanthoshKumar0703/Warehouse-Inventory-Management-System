const listeners = new Set();

export function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function publish(event) {
  listeners.forEach((cb) => cb(event));
}
