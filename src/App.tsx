import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { TrackingList } from './pages/TrackingList';
import { TrackingDetail } from './pages/TrackingDetail';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/tracking" replace />} />
          <Route path="/tracking" element={<TrackingList />} />
          <Route path="/tracking/:id" element={<TrackingDetail />} />
          <Route path="*" element={<div className="p-8 text-gray-500">페이지를 찾을 수 없습니다.</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
