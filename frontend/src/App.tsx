import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ChatInterface from './components/ChatInterface'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  const [refreshKey] = useState(0);

  return (
    <BrowserRouter>
      <Routes>
        {/* User Facing Chat App */}
        <Route path="/" element={
          <div className={window.self !== window.top
            ? "h-screen w-full bg-white flex flex-col overflow-hidden"
            : "min-h-screen w-full bg-[#f8fafc] flex items-center justify-center font-sans text-[#0f172a]"
          }>
            <div
              className={window.self !== window.top
                ? "w-full h-full flex flex-col overflow-hidden relative"
                : "w-full h-[100dvh] min-[480px]:w-full min-[480px]:max-w-[420px] min-[480px]:h-[90vh] bg-white min-[480px]:rounded-[18px] flex flex-col overflow-hidden relative shadow-[0_10px_40px_rgba(0,0,0,0.1)]"
              }
            >
              <div className="flex-1 overflow-hidden relative flex flex-col">
                <ChatInterface key={refreshKey} />
              </div>
            </div>
          </div>
        } />

        {/* Admin Login */}
        <Route path="/login" element={<Login />} />

        {/* Admin Register */}
        <Route path="/register" element={<Register />} />

        {/* Admin Dashboard */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
