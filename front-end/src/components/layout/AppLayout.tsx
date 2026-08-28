import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#09A9C2] relative overflow-hidden font-sans">
      {/* Círculos decorativos de colores flotando en el fondo turquesa */}
      <div className="pointer-events-none fixed top-12 left-72 h-40 w-40 rounded-full bg-[#E84B5B]/30 blur-xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="pointer-events-none fixed top-1/4 right-20 h-64 w-64 rounded-full bg-[#F4B51B]/35 blur-2xl animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="pointer-events-none fixed bottom-16 left-80 h-52 w-52 rounded-full bg-[#31B45A]/30 blur-2xl" />
      <div className="pointer-events-none fixed bottom-10 right-1/3 h-72 w-72 rounded-full bg-[#008BC1]/40 blur-2xl" />
      <div className="pointer-events-none fixed top-1/2 left-1/4 h-48 w-48 rounded-full bg-[#E8798A]/30 blur-2xl" />
      <div className="pointer-events-none fixed top-20 right-1/3 h-36 w-36 rounded-full bg-[#7D5AA6]/25 blur-xl" />

      {/* Esferas nítidas tipo puntos del logo NICE KIDS en el fondo */}
      <div className="pointer-events-none fixed top-24 right-48 h-8 w-8 rounded-full bg-[#E84B5B] opacity-40 shadow-lg" />
      <div className="pointer-events-none fixed top-40 right-64 h-12 w-12 rounded-full bg-[#31B45A] opacity-35 shadow-lg" />
      <div className="pointer-events-none fixed bottom-32 left-96 h-10 w-10 rounded-full bg-[#F4B51B] opacity-40 shadow-lg" />
      <div className="pointer-events-none fixed bottom-24 right-36 h-14 w-14 rounded-full bg-[#008BC1] opacity-35 shadow-lg" />
      <div className="pointer-events-none fixed top-1/3 left-80 h-7 w-7 rounded-full bg-[#7D5AA6] opacity-40 shadow-lg" />

      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden z-10">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


