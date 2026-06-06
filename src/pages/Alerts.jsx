import React, { useState } from 'react';
import Layout from '../components/Layout';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const MOCK_ACTIVE_ALERTS = [
  { id: 1, device: 'M1', type: 'NH3 Limit Exceeded', value: '45 ppm', threshold: '40 ppm', time: '10 mins ago', severity: 'high' },
  { id: 2, device: 'M2', type: 'H2S Limit Exceeded', value: '15 ppm', threshold: '10 ppm', time: '1 hour ago', severity: 'medium' },
];

const MOCK_ALERT_HISTORY = [
  { id: 3, device: 'M3', type: 'Device Offline', time: 'Yesterday, 14:30', status: 'resolved' },
  { id: 4, device: 'F1', type: 'NH3 Limit Exceeded', value: '55 ppm', threshold: '50 ppm', time: 'Yesterday, 09:15', status: 'resolved' },
  { id: 5, device: 'F2', type: 'Sensor Calibration Needed', time: 'Oct 24, 08:00', status: 'resolved' },
];

const Alerts = () => {
  const [activeTab, setActiveTab] = useState('active');

  return (
    <Layout>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>System Alerts</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage active warnings and view alert history.</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          className="btn-icon" 
          style={{ 
            background: activeTab === 'active' ? 'var(--accent-blue)' : 'var(--bg-glass)', 
            color: activeTab === 'active' ? '#fff' : 'var(--text-primary)' 
          }}
          onClick={() => setActiveTab('active')}
        >
          <AlertTriangle size={18} />
          Active Alerts ({MOCK_ACTIVE_ALERTS.length})
        </button>
        <button 
          className="btn-icon" 
          style={{ 
            background: activeTab === 'history' ? 'var(--accent-blue)' : 'var(--bg-glass)', 
            color: activeTab === 'history' ? '#fff' : 'var(--text-primary)' 
          }}
          onClick={() => setActiveTab('history')}
        >
          <Clock size={18} />
          Alert History
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '24px', minHeight: '400px' }}>
        {activeTab === 'active' && (
          <div>
            <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-red)', boxShadow: '0 0 10px var(--accent-red)' }} />
              Currently Active Alerts
            </h3>
            {MOCK_ACTIVE_ALERTS.length === 0 ? (
               <div style={{ color: 'var(--text-secondary)', padding: '24px', textAlign: 'center' }}>No active alerts. Everything is normal.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {MOCK_ACTIVE_ALERTS.map(alert => (
                  <div key={alert.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--accent-red)' }}>
                      <AlertTriangle size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{alert.device} - {alert.type}</h4>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{alert.time}</span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Value recorded at <strong>{alert.value}</strong> (Threshold: {alert.threshold})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
           <div>
             <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Clock size={20} color="var(--text-secondary)" />
               Past Alerts & Events
             </h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {MOCK_ALERT_HISTORY.map(alert => (
                  <div key={alert.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '16px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
                    <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '12px', borderRadius: '50%', color: '#22c55e' }}>
                      <CheckCircle size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem' }}>{alert.device} - {alert.type}</h4>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{alert.time}</span>
                      </div>
                      {alert.value && (
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                          Value: {alert.value} / Threshold: {alert.threshold}
                        </p>
                      )}
                    </div>
                    <div style={{ alignSelf: 'center', padding: '4px 12px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '16px', fontSize: '0.85rem', fontWeight: '500' }}>
                      Resolved
                    </div>
                  </div>
                ))}
             </div>
           </div>
        )}
      </div>
    </Layout>
  );
};

export default Alerts;
