import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { categoryAccent } from './navigation';
import { PlayfulDotsPattern } from '../ui/CloudDecoration';

export function AppLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  return (
    <div className={`nk-app accent-${categoryAccent(pathname)} relative flex min-h-dvh text-school-body`} data-role={user?.role}>
      <PlayfulDotsPattern />
      <a href="#main-content" className="sr-only z-50 rounded-xl bg-white p-3 text-ink-turquoise shadow-md focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Saltar al contenido principal</a>
      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 p-4 outline-none sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
