import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { PlayfulDotsPattern, SparkleStar } from '../ui/CloudDecoration';

export function AppLayout() {
  return (
    <div className="flex min-h-dvh bg-white font-sans text-[#365451] relative overflow-hidden">
      {/* Background decorations */}
      <PlayfulDotsPattern className="z-0" />
      <div className="absolute top-1/4 left-1/4 z-0 opacity-40">
        <SparkleStar size={32} color="#F2C700" />
      </div>
      <div className="absolute top-3/4 right-1/4 z-0 opacity-30">
        <SparkleStar size={24} color="#41C4BD" />
      </div>
      <div className="absolute bottom-1/4 left-1/3 z-0 opacity-20">
        <SparkleStar size={40} color="#FF5DA0" />
      </div>

      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-white p-3 text-[#41C4BD] shadow-md focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:ring-2 focus:ring-[#41C4BD]"
      >
        Saltar al contenido principal
      </a>
      <div className="z-10 flex min-h-dvh">
        <Sidebar />
      </div>
      <div className="flex min-w-0 flex-1 flex-col z-10 relative">
        <Navbar />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 p-4 outline-none sm:p-6 lg:p-8"
        >
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
