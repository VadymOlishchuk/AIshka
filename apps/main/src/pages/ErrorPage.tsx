import { Link, isRouteErrorResponse, useRouteError } from "react-router";
import { Button, Card } from "@aishka/ui/primitives";

export function ErrorPage({ notFound = false }: { notFound?: boolean }) {
  const error = useRouteError();
  const is404 = notFound || (isRouteErrorResponse(error) && error.status === 404);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center px-5 py-12">
      <Card className="p-7 text-center">
        <h1 className="mb-2 text-[28px] text-ink-strong">
          {is404 ? "Nothing here" : "Something went wrong"}
        </h1>
        <p className="mb-6 text-[15px] leading-relaxed text-ink-muted">
          {is404
            ? "The page you're looking for doesn't exist or has moved."
            : "Try again in a moment. If it keeps happening, we're already looking into it."}
        </p>
        <Link to="/dashboard">
          <Button className="w-full">Back home</Button>
        </Link>
      </Card>
    </main>
  );
}
