import { useEffect } from "react";

const DEFAULT_TITLE = "Organia Task Manager";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}
