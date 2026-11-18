import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-semibold">页面走丢了</h1>
      <p className="mt-3 text-sm text-[var(--muted)]">
        这个地址没有对应的内容。
      </p>
      <Link
        to="/"
        className="mt-6 inline-block text-sm text-[var(--accent)] underline underline-offset-4"
      >
        回到首页
      </Link>
    </div>
  );
}
