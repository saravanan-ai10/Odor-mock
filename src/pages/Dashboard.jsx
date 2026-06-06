import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { Edit2, Save, X, AlertTriangle } from 'lucide-react';

// --- MOCK DATA SETUP ---
const MOCK_DEVICES = ['device1', 'device2', 'device3', 'device4', 'device5'];
const DEFAULT_NICKNAMES = {
  device1: 'M1',
  device2: 'M2',
  device3: 'M3',
  device4: 'F1',
  device5: 'F2'
};

const generateMockData = () => {
  const data = {};
  const now = Date.now() / 1000;
  
  // Pre-calculate the peak start hour (0-22) for each of the last 30 days
  // This ensures all devices peak at the same time on any given day
  const peakHoursPerDay = {};
  for (let day = 0; day <= 30; day++) {
    peakHoursPerDay[day] = Math.floor(Math.random() * 23); // Peak can start anywhere between 00:00 and 22:00
  }
  
  MOCK_DEVICES.forEach(device => {
    data[device] = [];
    // Starting values for a smooth random walk (base levels)
    let currentNh3 = 8.0;
    let currentH2s = 1.0;
    
    for (let i = 720; i >= 0; i--) { // Generate 30 days of data (720 hours)
      const timestamp = now - (i * 3600);
      const dateObj = new Date(timestamp * 1000);
      const currentHour = dateObj.getHours();
      const dayIndex = Math.floor(i / 24); // Represents which day we are on (0 to 30)
      
      const peakHourStart = peakHoursPerDay[dayIndex];
      const peakDuration = 2; // 2 hour peak
      
      // Add random variation but keep it smooth (random walk)
      currentNh3 = currentNh3 + (Math.random() * 2 - 1); // fluctuates by +/- 1
      currentH2s = currentH2s + (Math.random() * 0.4 - 0.2); // fluctuates by +/- 0.2
      
      // Keep base values within realistic bounds
      currentNh3 = Math.max(2, Math.min(15, currentNh3));
      currentH2s = Math.max(0.1, Math.min(2.5, currentH2s));

      let finalNh3 = currentNh3;
      let finalH2s = currentH2s;

      // Apply the daily peak if the current hour falls in the synchronised peak window
      if (currentHour === peakHourStart || currentHour === peakHourStart + 1) {
         // Create a realistic spike
         finalNh3 += (Math.random() * 15 + 15); // Spike by an extra +15 to +30 ppm
         finalH2s += (Math.random() * 3 + 2);   // Spike by an extra +2 to +5 ppm
      }

      data[device].push({
        timestamp,
        originalTime: dateObj.toLocaleString(),
        nh3: parseFloat(finalNh3.toFixed(2)), 
        h2s: parseFloat(finalH2s.toFixed(2)) 
      });
    }
  });
  return data;
};
const staticMockData = generateMockData();
// -----------------------

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [nicknames, setNicknames] = useState({});
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Nickname State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  // Thresholds State
  const [thresholds, setThresholds] = useState({ nh3: '', h2s: '' });
  const [isEditingThresholds, setIsEditingThresholds] = useState(false);

  // Filter State
  const [filterMode, setFilterMode] = useState('24h'); // '24h' or 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Overview State
  const [allDevicesData, setAllDevicesData] = useState({});

  // 1. Fetch available devices and nicknames
  useEffect(() => {
    if (!currentUser) return;
    
    setDevices(MOCK_DEVICES);
    
    const devicesDataMap = {};
    MOCK_DEVICES.forEach(id => {
      const deviceData = staticMockData[id];
      const latest = deviceData[deviceData.length - 1];
      devicesDataMap[id] = {
        alive: true,
        lastSeen: latest.originalTime,
        nh3: latest.nh3,
        h2s: latest.h2s
      };
    });
    setAllDevicesData(devicesDataMap);

    const savedNicknames = localStorage.getItem(`nicknames_${currentUser.username}`);
    if (savedNicknames) {
      setNicknames(JSON.parse(savedNicknames));
    } else {
      setNicknames(DEFAULT_NICKNAMES);
      localStorage.setItem(`nicknames_${currentUser.username}`, JSON.stringify(DEFAULT_NICKNAMES));
    }
  }, [currentUser]);

  // Fetch thresholds for selected device
  useEffect(() => {
    if (!selectedDevice || !currentUser) return;
    const savedThresholds = localStorage.getItem(`thresholds_${currentUser.username}_${selectedDevice}`);
    if (savedThresholds) {
      setThresholds(JSON.parse(savedThresholds));
    } else {
      setThresholds({ nh3: '', h2s: '' });
    }
  }, [selectedDevice, currentUser]);

  // 2. Fetch telemetry data for the selected device
  useEffect(() => {
    if (!selectedDevice) return;
    setLoading(true);
    
    setTimeout(() => {
      const rawData = staticMockData[selectedDevice];
      
      const now = Date.now() / 1000;
      const twentyFourHoursAgo = now - (24 * 60 * 60);
      
      let startTimestamp = 0;
      let endTimestamp = Infinity;

      if (filterMode === '24h') {
        startTimestamp = twentyFourHoursAgo;
      } else if (filterMode === 'custom' && customStart && customEnd) {
        startTimestamp = new Date(customStart).getTime() / 1000;
        endTimestamp = new Date(customEnd).getTime() / 1000;
      }

      let parsedData = rawData.filter(entry => entry.timestamp >= startTimestamp && entry.timestamp <= endTimestamp)
        .map(entry => {
          const dateObj = new Date(entry.timestamp * 1000);
          let timeLabel = '';
          if (filterMode === '24h') {
            timeLabel = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else {
            timeLabel = dateObj.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          }
          return {
            ...entry,
            timeLabel
          };
        });

      setData(parsedData);
      setLoading(false);
    }, 300);
  }, [selectedDevice, filterMode, customStart, customEnd]);

  // Save nickname
  const saveNickname = () => {
    if (!selectedDevice || !currentUser) return;
    const newNicknames = { ...nicknames, [selectedDevice]: editName.trim() };
    setNicknames(newNicknames);
    localStorage.setItem(`nicknames_${currentUser.username}`, JSON.stringify(newNicknames));
    setIsEditing(false);
  };

  // Save thresholds
  const saveThresholds = () => {
    if (!selectedDevice || !currentUser) return;
    const newThresholds = {
      nh3: thresholds.nh3 ? Number(thresholds.nh3) : null,
      h2s: thresholds.h2s ? Number(thresholds.h2s) : null
    };
    setThresholds(newThresholds);
    localStorage.setItem(`thresholds_${currentUser.username}_${selectedDevice}`, JSON.stringify(newThresholds));
    setIsEditingThresholds(false);
  };

  const getDisplayName = (id) => nicknames[id] || id;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel" style={{ padding: '12px', border: '1px solid var(--border-glass)' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '14px' }}>{payload[0].payload.originalTime}</p>
          {payload.map((entry, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color }} />
              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                {entry.name}: {entry.value} ppm
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Telemetry Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Monitoring historical levels across all registered devices</p>
        </div>
        
        {/* Date/Time Filters */}
        {selectedDevice && (
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn-icon" 
                style={{ background: filterMode === '24h' ? 'var(--accent-blue)' : 'var(--bg-glass)', color: filterMode === '24h' ? '#fff' : 'var(--text-primary)' }}
                onClick={() => setFilterMode('24h')}
              >
                Last 24 Hours
              </button>
              <button 
                className="btn-icon"
                style={{ background: filterMode === 'custom' ? 'var(--accent-blue)' : 'var(--bg-glass)', color: filterMode === 'custom' ? '#fff' : 'var(--text-primary)' }}
                onClick={() => setFilterMode('custom')}
              >
                Custom Range
              </button>
            </div>
            {filterMode === 'custom' && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input 
                  type="datetime-local" 
                  className="base-input" 
                  value={customStart} 
                  onChange={(e) => setCustomStart(e.target.value)} 
                  style={{ padding: '8px', maxWidth: '200px' }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>to</span>
                <input 
                  type="datetime-local" 
                  className="base-input" 
                  value={customEnd} 
                  onChange={(e) => setCustomEnd(e.target.value)} 
                  style={{ padding: '8px', maxWidth: '200px' }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {!selectedDevice ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {devices.map(deviceId => {
            const data = allDevicesData[deviceId] || {};
            return (
              <div key={deviceId} className="glass-panel" style={{ padding: '24px', cursor: 'pointer', transition: 'transform 0.2s', borderTop: `4px solid ${data.alive ? 'var(--accent-blue)' : 'var(--accent-red)'}` }} onClick={() => setSelectedDevice(deviceId)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{getDisplayName(deviceId)}</h3>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: data.alive ? 'var(--accent-blue)' : 'var(--accent-red)', boxShadow: `0 0 8px ${data.alive ? 'var(--accent-blue)' : 'var(--accent-red)'}` }} title={data.alive ? "Online" : "Offline"} />
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  Last Updated: {data.lastSeen}
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>NH3 Avg</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{data.nh3 || 0} ppm</div>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.03)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>H2S Avg</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{data.h2s || 0} ppm</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <button 
            className="btn-icon" 
            style={{ marginBottom: '24px', background: 'var(--bg-glass)' }} 
            onClick={() => setSelectedDevice('')}
          >
            ← Back to Overview
          </button>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '24px' }}>
        
        {/* Device Selection Panel */}
        <div className="glass-panel" style={{ padding: '24px', flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Active Device</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <select 
              className="base-input" 
              value={selectedDevice} 
              onChange={(e) => {
                setSelectedDevice(e.target.value);
                setIsEditing(false);
                setIsEditingThresholds(false);
              }}
            >
              {devices.map(deviceId => (
                <option key={deviceId} value={deviceId} style={{ background: 'var(--bg-primary)' }}>
                  {getDisplayName(deviceId)}
                </option>
              ))}
            </select>

            {selectedDevice && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                {!isEditing ? (
                  <button 
                    onClick={() => {
                      setEditName(getDisplayName(selectedDevice));
                      setIsEditing(true);
                    }}
                    className="btn-icon"
                    title="Edit Device Nickname"
                  >
                    <Edit2 size={16} />
                    <span>Rename Device</span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <input 
                      type="text" 
                      className="base-input" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Enter custom nickname..."
                      style={{ marginBottom: '0', padding: '8px 12px' }}
                      autoFocus
                    />
                    <button onClick={saveNickname} className="btn-icon save-btn" style={{ padding: '8px' }}>
                      <Save size={16} />
                    </button>
                    <button onClick={() => setIsEditing(false)} className="btn-icon cancel-btn" style={{ padding: '8px' }}>
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Threshold Options Panel */}
        <div className="glass-panel" style={{ padding: '24px', flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={20} color="var(--accent-red)" />
            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Device Thresholds</h3>
          </div>
          
          {selectedDevice ? (
            !isEditingThresholds ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>NH3 Limit</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: thresholds.nh3 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {thresholds.nh3 ? `${thresholds.nh3} ppm` : 'Not Set'}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>H2S Limit</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: thresholds.h2s ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {thresholds.h2s ? `${thresholds.h2s} ppm` : 'Not Set'}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEditingThresholds(true)}
                  className="btn-icon"
                  style={{ width: 'fit-content' }}
                >
                  <Edit2 size={16} />
                  <span>Configure Limits</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="input-label" style={{ fontSize: '0.8rem' }}>NH3 (ppm)</label>
                    <input 
                      type="number" 
                      className="base-input" 
                      value={thresholds.nh3}
                      onChange={(e) => setThresholds({...thresholds, nh3: e.target.value})}
                      placeholder="e.g. 50"
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="input-label" style={{ fontSize: '0.8rem' }}>H2S (ppm)</label>
                    <input 
                      type="number" 
                      className="base-input" 
                      value={thresholds.h2s}
                      onChange={(e) => setThresholds({...thresholds, h2s: e.target.value})}
                      placeholder="e.g. 10"
                      style={{ padding: '8px 12px' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={saveThresholds} className="btn-icon save-btn" style={{ flex: 1, justifyContent: 'center' }}>
                    <Save size={16} /> Save
                  </button>
                  <button onClick={() => setIsEditingThresholds(false)} className="btn-icon cancel-btn" style={{ flex: 1, justifyContent: 'center' }}>
                    <X size={16} /> Cancel
                  </button>
                </div>
              </div>
            )
          ) : (
            <div style={{ color: 'var(--text-secondary)' }}>Select a device to configure thresholds.</div>
          )}
        </div>

      </div>

      {loading ? (
        <div style={{ display: 'flex', height: '400px', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
          Loading historical data for {getDisplayName(selectedDevice)}...
        </div>
      ) : data.length === 0 ? (
        <div className="glass-panel" style={{ display: 'flex', height: '300px', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          No historical data available for this device.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px' }}>
          
          {/* NH3 Chart */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '24px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-blue)', boxShadow: '0 0 10px var(--accent-blue)' }} />
              Ammonia (NH3) Trend - {getDisplayName(selectedDevice)}
            </h3>
            <div style={{ width: '100%', height: '320px' }}>
              <ResponsiveContainer>
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorNh3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                  <XAxis dataKey="timeLabel" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} ppm`} />
                  <Tooltip content={<CustomTooltip />} />
                  {thresholds.nh3 && (
                    <ReferenceLine y={Number(thresholds.nh3)} stroke="var(--accent-red)" strokeDasharray="3 3" label={{ position: 'top', value: 'Limit', fill: 'var(--accent-red)', fontSize: '12px' }} />
                  )}
                  <Area 
                    type="monotone" 
                    dataKey="nh3" 
                    name="NH3 Average" 
                    stroke="var(--accent-blue)" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorNh3)" 
                    dot={(props) => {
                      if (thresholds.nh3 && props.payload.nh3 >= Number(thresholds.nh3)) {
                        return <circle key={`dot-${props.index}`} cx={props.cx} cy={props.cy} r={6} fill="var(--accent-red)" stroke="#fff" strokeWidth={2} />;
                      }
                      return null;
                    }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* H2S Chart */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '24px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-purple)', boxShadow: '0 0 10px var(--accent-purple)' }} />
              Hydrogen Sulfide (H2S) Trend - {getDisplayName(selectedDevice)}
            </h3>
            <div style={{ width: '100%', height: '320px' }}>
              <ResponsiveContainer>
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorH2s" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" vertical={false} />
                  <XAxis dataKey="timeLabel" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} ppm`} />
                  <Tooltip content={<CustomTooltip />} />
                  {thresholds.h2s && (
                    <ReferenceLine y={Number(thresholds.h2s)} stroke="var(--accent-red)" strokeDasharray="3 3" label={{ position: 'top', value: 'Limit', fill: 'var(--accent-red)', fontSize: '12px' }} />
                  )}
                  <Area 
                    type="monotone" 
                    dataKey="h2s" 
                    name="H2S Average" 
                    stroke="var(--accent-purple)" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorH2s)" 
                    dot={(props) => {
                      if (thresholds.h2s && props.payload.h2s >= Number(thresholds.h2s)) {
                        return <circle key={`dot-${props.index}`} cx={props.cx} cy={props.cy} r={6} fill="var(--accent-red)" stroke="#fff" strokeWidth={2} />;
                      }
                      return null;
                    }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
      </>
      )}
    </Layout>
  );
};

export default Dashboard;
