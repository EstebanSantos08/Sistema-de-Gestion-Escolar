import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <div className="flex min-h-dvh bg-[#F4FAF9] font-sans text-[#365451]">
      <a href="#main-content" className="sr-only z-50 rounded-lg bg-white p-3 text-[#087F79] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Saltar al contenido</a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 p-4 outline-none md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
