import { useEffect } from "react";

/** Заголовок вкладки. Замість metadata Next — один хук на сторінку. */
export function useTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
