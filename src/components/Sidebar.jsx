import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, Settings, Bell } from 'lucide-react';

const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <div className="glass-panel" style={{ 
      width: '280px', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '24px',
      margin: '24px',
      marginRight: '0',
      height: 'fit-content'
    }}>
      <div style={{ marginBottom: '48px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '12px', 
          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <Activity size={24} color="white" />
        </div>
        <div>
          <h2 className="gradient-text" style={{ fontSize: '1.25rem', lineHeight: '1.2' }}>OdorSense</h2>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '500' }}>by The Intellect</span>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          padding: '12px 16px', 
          background: 'rgba(59, 130, 246, 0.1)',
          color: 'var(--accent-blue)',
          borderRadius: '8px',
          fontWeight: '500',
          cursor: 'pointer'
        }}>
          <Activity size={20} />
          <span>Dashboard</span>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          padding: '12px 16px', 
          color: 'var(--text-secondary)',
          borderRadius: '8px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }} className="hover-item">
          <Bell size={20} />
          <span>Alerts</span>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          padding: '12px 16px', 
          color: 'var(--text-secondary)',
          borderRadius: '8px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}>
          <Settings size={20} />
          <span>Settings</span>
        </div>
      </nav>

      <button onClick={logout} className="btn-primary" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)' }}>
        <LogOut size={20} />
        <span>Sign Out</span>
      </button>

      <style>{`
        .hover-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary) !important;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
