import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function AppLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-64">
        <Navbar onMenu={() => setMenuOpen(true)} />
        <main className="print-shell mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
