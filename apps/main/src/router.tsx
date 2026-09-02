import { createBrowserRouter, redirect, type LoaderFunctionArgs } from "react-router";
import type { BuildView } from "@aishka/core/build/service";
import type { CatalogCourse, CourseView } from "@aishka/core/progress/service";
import { ApiError, api, fetchMe, load } from "@aishka/ui/api";
import { ErrorPage } from "./pages/ErrorPage";
import { Login } from "./pages/auth/Login";
import { Reset } from "./pages/auth/Reset";
import { SetPassword } from "./pages/auth/SetPassword";
import { OnboardingStep, type OnboardingState } from "./pages/onboarding/Step";
import { PlanReady, type ReadyView } from "./pages/onboarding/Ready";
import { DashboardLayout } from "./pages/dashboard/Layout";
import { Home } from "./pages/dashboard/Home";
import { Build } from "./pages/dashboard/Build";
import { Academy } from "./pages/dashboard/Academy";
import { Course } from "./pages/dashboard/Course";
import { Lesson, type LessonView } from "./pages/dashboard/Lesson";
import { Profile } from "./pages/dashboard/Profile";

/**
 * Маршрути. Кожна сторінка отримує дані через loader ще до рендера — так само,
 * як серверні компоненти в Next, тільки з API. Редіректи теж живуть тут,
 * а не в компонентах: сторінка або є, або людину вже повели далі.
 */
export const router = createBrowserRouter([
  // Лендінг і реєстрація — в apps/landing на своєму піддомені. Корінь платформи
  // веде в дашборд; без сесії loader дашборду сам відправить на вхід.
  { path: "/", loader: () => redirect("/dashboard") },
  { path: "/login", element: <Login />, errorElement: <ErrorPage /> },
  { path: "/reset", element: <Reset />, errorElement: <ErrorPage /> },
  { path: "/set-password", element: <SetPassword />, errorElement: <ErrorPage /> },

  {
    id: "onboarding",
    path: "/onboarding",
    errorElement: <ErrorPage />,
    loader: ({ request }) => load<OnboardingState>("/api/onboarding", request),
    children: [
      {
        // Маршрут визначає одне поле користувача — «застрягти посеред опитування» неможливо.
        index: true,
        loader: async ({ request }: LoaderFunctionArgs) => {
          const state = await load<OnboardingState>("/api/onboarding", request);
          if (state.done) return redirect("/dashboard");
          const slug = state.steps.some((s) => s.slug === state.current)
            ? state.current
            : state.steps[0]!.slug;
          return redirect(`/onboarding/${slug}`);
        },
      },
      {
        path: "ready",
        element: <PlanReady />,
        loader: async ({ request }: LoaderFunctionArgs) => {
          try {
            return await load<ReadyView>("/api/onboarding/ready", request);
          } catch (error) {
            // Плану ще немає — людина не дійшла до кінця опитування.
            if (error instanceof Response && error.status === 404) return redirect("/onboarding");
            throw error;
          }
        },
      },
      { path: ":step", element: <OnboardingStep /> },
    ],
  },

  {
    id: "dashboard",
    path: "/dashboard",
    element: <DashboardLayout />,
    errorElement: <ErrorPage />,
    loader: ({ request }) => fetchMe(request),
    children: [
      {
        index: true,
        element: <Home />,
        loader: async ({ request }: LoaderFunctionArgs) => {
          const me = await fetchMe(request);
          if (!me.onboardingDone) return redirect("/onboarding");
          try {
            return { me, build: await api.get<BuildView>("/api/build") };
          } catch (error) {
            if (error instanceof ApiError && error.code === "not_found") {
              return redirect("/dashboard/journey/academy");
            }
            throw error;
          }
        },
      },
      {
        path: "build",
        element: <Build />,
        loader: async ({ request }: LoaderFunctionArgs) => {
          try {
            return await load<BuildView>("/api/build", request);
          } catch (error) {
            if (error instanceof Response && error.status === 404) return redirect("/dashboard");
            throw error;
          }
        },
      },
      // План із відсотком замінено Збіркою — Journey веде просто в бібліотеку.
      { path: "journey", loader: () => redirect("/dashboard/journey/academy") },
      {
        path: "journey/academy",
        element: <Academy />,
        loader: ({ request }) => load<CatalogCourse[]>("/api/catalog", request),
      },
      {
        path: "course/:slug",
        element: <Course />,
        loader: ({ request, params }) => load<CourseView>(`/api/courses/${params.slug}`, request),
      },
      {
        path: "lesson/:slug",
        element: <Lesson />,
        loader: async ({ request, params }: LoaderFunctionArgs) => {
          try {
            return await load<LessonView>(`/api/lessons/${params.slug}`, request);
          } catch (error) {
            // Урок замкнений, поки не пройдено попередній — ведемо назад у збірку.
            if (error instanceof Response && error.status === 403) return redirect("/dashboard/build");
            throw error;
          }
        },
      },
      { path: "profile", element: <Profile /> },
    ],
  },

  { path: "*", element: <ErrorPage notFound /> },
]);
