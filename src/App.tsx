import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { TrackingList } from './pages/TrackingList';
import { TrackingDetail } from './pages/TrackingDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tracking" element={<TrackingList />} />
          <Route path="/tracking/:id" element={<TrackingDetail />} />
          <Route path="*" element={<div className="p-8 text-gray-500">페이지를 찾을 수 없습니다.</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
