import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Watch from './pages/Watch';
import Vault from './pages/Vault';
import SLGDC from './pages/SLGDC';
import SearchResults from './pages/SearchResults';
import Gallery from './pages/Gallery';
import Jobs from './pages/Jobs';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Shop from './pages/Shop';
import ProtectedRoute from './components/ProtectedRoute';
import WelcomePopup from './components/WelcomePopup';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <WelcomePopup />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vault" element={<Vault />} />
          {/* keep /courses for backward compatibility */}
          <Route path="/courses" element={<Vault />} />
          <Route path="/slgdc" element={<SLGDC />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
