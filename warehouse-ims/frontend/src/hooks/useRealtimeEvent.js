import { useEffect } from "react";
import { subscribe } from "../lib/realtimeBus.js";

/** Calls `callback(event)` whenever the backend broadcasts an inventory_event
 * over Socket.IO. Pass a stable callback (e.g. wrap in useCallback) if it
 * has dependencies that change often.
 */
export function useRealtimeEvent(callback) {
  useEffect(() => {
    const unsubscribe = subscribe(callback);
    return unsubscribe;
  }, [callback]);
}
