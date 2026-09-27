import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import ToastContainer from '@/components/Toast';
import PublicLayout from '@/layouts/PublicLayout';
import AdminLayout from '@/layouts/AdminLayout';
import RequireAuth from '@/components/RequireAuth';

import Home from '@/pages/Home';
import PetList from '@/pages/PetList';
import PetDetail from '@/pages/PetDetail';
import Login from '@/pages/Login';
import Publish from '@/pages/Publish';
import Profile from '@/pages/Profile';
import Announcements from '@/pages/Announcements';
import About from '@/pages/About';
import NotFound from '@/pages/NotFound';

import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminPets from '@/pages/admin/AdminPets';
import AdminAdoptions from '@/pages/admin/AdminAdoptions';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminAnnouncements from '@/pages/admin/AdminAnnouncements';
import AdminStats from '@/pages/admin/AdminStats';

export default function App() {
  const init = useAuthStore(s => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Router>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/pets" element={<PetList />} />
          <Route path="/pets/:id" element={<PetDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/publish" element={<RequireAuth><Publish /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/about" element={<About />} />
        </Route>

        <Route path="/admin" element={<RequireAuth requireAdmin><AdminLayout /></RequireAuth>}>
          <Route index element={<AdminDashboard />} />
          <Route path="pets" element={<AdminPets />} />
          <Route path="adoptions" element={<AdminAdoptions />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="stats" element={<AdminStats />} />
        </Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      <ToastContainer />
    </Router>
  );
}
