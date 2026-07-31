import { useState, useCallback } from "react";

// Small reusable hook so JobSearch and ParserForm don't each hand-roll
// their own loading/error/data state.
export function useAsync(asyncFn) {
  const [state, setState] = useState({ status: "idle", data: null, error: null });

  const run = useCallback(
    async (...args) => {
      setState({ status: "loading", data: null, error: null });
      try {
        const data = await asyncFn(...args);
        setState({ status: "success", data, error: null });
        return data;
      } catch (err) {
        setState({ status: "error", data: null, error: err.message });
        throw err;
      }
    },
    [asyncFn]
  );

  return { ...state, run };
}
