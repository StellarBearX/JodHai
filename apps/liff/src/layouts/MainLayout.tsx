import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, ListOrdered, Settings, MessageSquare } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'หน้าหลัก', icon: LayoutDashboard },
  { to: '/history', label: 'ประวัติ', icon: ListOrdered },
  { to: '/chat', label: 'แชท', icon: MessageSquare },
  { to: '/settings', label: 'ตั้งค่า', icon: Settings },
];

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen" style={{ paddingBottom: 'var(--bottom-nav-height)' }}>
      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <Icon size={22} strokeWidth={1.8} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
