import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListOrdered, Settings, MessageSquare } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',        label: 'หน้าหลัก', icon: LayoutDashboard },
  { to: '/history', label: 'ประวัติ',   icon: ListOrdered    },
  { to: '/chat',    label: 'แชท',       icon: MessageSquare  },
  { to: '/settings',label: 'ตั้งค่า',   icon: Settings       },
];

export default function MainLayout() {
  const { pathname } = useLocation();
  // Chat page needs full-height flex layout (input pinned at bottom)
  const isChatPage = pathname === '/chat';

  return (
    <div
      className="flex flex-col"
      style={{ height: '100dvh', paddingBottom: 'var(--bottom-nav-height)' }}
    >
      {/* Page content */}
      <main
        className={isChatPage ? 'flex-1 flex flex-col min-h-0 overflow-hidden' : 'flex-1 overflow-y-auto'}
      >
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
