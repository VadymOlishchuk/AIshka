import { Link } from "react-router";
import { Button, Card } from "@aishka/ui/primitives";

export function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-center px-5 py-12">
      <Card className="p-7 text-center">
        <h1 className="mb-2 text-[28px] text-ink-strong">Nothing here</h1>
        <p className="mb-6 text-[15px] leading-relaxed text-ink-muted">
          The page you're looking for doesn't exist or has moved.
        </p>
        <Link to="/">
          <Button className="w-full">Back to the start</Button>
        </Link>
      </Card>
    </main>
  );
}
