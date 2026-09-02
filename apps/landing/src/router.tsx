import { createBrowserRouter } from "react-router";
import { api } from "@aishka/ui/api";
import { Landing, type LandingCourse } from "./pages/Landing";
import { Register } from "./pages/Register";
import { NotFound } from "./pages/NotFound";

/**
 * Воронка: лендінг -> реєстрація -> (оплата, етап 3) -> платформа.
 * Кожен наступний лендінг чи воронка — ще один маршрут тут, а не ще один застосунок.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
    errorElement: <NotFound />,
    // Вітрина публічна: без бекенда показуємо її без каталогу, а не помилку.
    loader: () => api.get<LandingCourse[]>("/api/landing").catch(() => [] as LandingCourse[]),
  },
  { path: "/register", element: <Register />, errorElement: <NotFound /> },
  { path: "*", element: <NotFound /> },
]);
