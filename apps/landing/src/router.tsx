import { createBrowserRouter } from "react-router";
import type { OrderView } from "@aishka/core/billing/checkout";
import { api, load } from "@aishka/ui/api";
import { Landing, type LandingCourse } from "./pages/Landing";
import { Start } from "./pages/Start";
import { Checkout } from "./pages/Checkout";
import { SetPassword } from "./pages/SetPassword";
import { NotFound } from "./pages/NotFound";

/**
 * Воронка: /  ->  /start (email)  ->  /checkout/:id (оплата)  ->  /set-password (пароль)
 * -> платформа вже з сесією. Кожен наступний лендінг — ще один маршрут тут,
 * воронка при цьому та сама.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
    errorElement: <NotFound />,
    // Вітрина публічна: без бекенда показуємо її без каталогу, а не помилку.
    loader: () => api.get<LandingCourse[]>("/api/landing").catch(() => [] as LandingCourse[]),
  },
  { path: "/start", element: <Start />, errorElement: <NotFound /> },
  {
    path: "/checkout/:id",
    element: <Checkout />,
    errorElement: <NotFound />,
    loader: ({ request, params }) => load<OrderView>(`/api/checkout/${params.id}`, request),
  },
  { path: "/set-password", element: <SetPassword />, errorElement: <NotFound /> },
  { path: "*", element: <NotFound /> },
]);
