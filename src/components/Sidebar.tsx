import { LayoutDashboard, Users, FileSearch } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';

export function Sidebar() {
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: '대시보드', disabled: true },
        { to: '/tracking', icon: FileSearch, label: '콘텐츠\n성과' },
        { to: '/creators', icon: Users, label: '크리에이터', disabled: true },
    ];

    return (
        <div className="flex h-screen w-20 flex-col border-r bg-white">
            <div className="flex h-14 items-center justify-center border-b px-2">
                <span className="text-xs font-bold text-gray-900">W.CONCEPT.</span>
            </div>
            <nav className="flex-1 flex flex-col items-center gap-1 p-2 pt-4">
                {navItems.map((item) => (
                    item.disabled ? (
                        <div
                            key={item.to}
                            className="flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors w-full text-center text-gray-300 cursor-not-allowed"
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="whitespace-pre-line leading-tight">{item.label}</span>
                        </div>
                    ) : (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                cn(
                                    'flex flex-col items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors w-full text-center',
                                    isActive
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-600 hover:bg-gray-100'
                                )
                            }
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="whitespace-pre-line leading-tight">{item.label}</span>
                        </NavLink>
                    )
                ))}
            </nav>
        </div>
    );
}
