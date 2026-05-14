import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListOrdered, Settings, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavItem { to: string; label: string; icon: React.ElementType; }

const NAV: NavItem[] = [
  { to: '/',         label: 'หน้าหลัก', icon: LayoutDashboard },
  { to: '/history',  label: 'ประวัติ',   icon: ListOrdered    },
  { to: '/chat',     label: 'แชท',       icon: MessageSquare  },
  { to: '/settings', label: 'ตั้งค่า',   icon: Settings       },
];

export default function MainLayout() {
  const { pathname } = useLocation();
  const isChatPage = pathname === '/chat';

  return (
    <div className="flex flex-col" style={{ height: '100dvh', paddingBottom: 'var(--bottom-nav-height)' }}>
      <main className={isChatPage ? 'flex-1 flex flex-col min-h-0 overflow-hidden' : 'flex-1 overflow-y-auto'}>
        <Outlet />
      </main>

      <nav className="bottom-nav">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'}>
            {({ isActive }) => (
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="bottom-nav-item"
                style={{ color: isActive ? 'var(--color-brand-dark)' : 'var(--color-text-muted)' }}
              >
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute -inset-1.5 rounded-xl"
                      style={{ background: 'var(--color-brand-dim)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.7} className="relative" />
                </div>
                <span className="text-xs font-semibold">{label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
