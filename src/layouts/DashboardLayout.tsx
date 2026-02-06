import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';

export function DashboardLayout() {
    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-6xl mx-auto px-8 py-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
