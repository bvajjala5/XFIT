import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';

export default function NotFound({
  title = 'Not found',
  message = 'The thing you were looking for does not exist or may have been removed.',
  actionTo = '/',
  actionLabel = 'Go home',
}) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background text-center">
      <div className="max-w-md space-y-5">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <SearchX className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-muted-foreground">{message}</p>
        </div>
        <Link
          to={actionTo}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {actionLabel}
        </Link>
      </div>
    </main>
  );
}
