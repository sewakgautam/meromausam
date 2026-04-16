import { useEffect } from 'react';
import { useStore } from '../stores/appStore';
import { api } from '../utils/api';
import MapView from '../components/MapView';
import MapSidebar from '../components/MapSidebar';

export default function MapPage() {
  const { setOverview, setAllDaysData, setAlerts, setLoading, loading } = useStore();

  // Lock body scroll on the map page, restore it when leaving
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getOverview(),
      api.getForecastMatrix(),
      api.getAlerts(),
    ])
      .then(([overview, matrix, alerts]) => {
        setOverview(overview);
        setAllDaysData(matrix);
        setAlerts(alerts);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Refresh alerts every 5 minutes
    const interval = setInterval(() => {
      api.getAlerts().then(setAlerts).catch(() => {});
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Left sidebar */}
      <MapSidebar />

      {/* Map area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {loading && (
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 2000,
              background: 'rgba(10,22,40,0.88)',
              backdropFilter: 'blur(12px)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 16,
            }}
          >
            <div style={{ fontSize: 52 }}>🌦️</div>
            <div style={{
              fontFamily: 'Sora, sans-serif', color: 'white',
              fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em',
            }}>
              Loading MeroMausam
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
              Fetching weather data for all 77 districts…
            </div>
            {/* Progress bar shimmer */}
            <div style={{
              width: 220, height: 3, background: 'rgba(255,255,255,0.08)',
              borderRadius: 2, overflow: 'hidden', marginTop: 4,
            }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: 'linear-gradient(90deg, transparent, #3182ce, transparent)',
                animation: 'slideIn 1.4s ease-in-out infinite',
                width: '50%',
              }} />
            </div>
            <style>{`
              @keyframes slideIn {
                0%   { transform: translateX(-200%); }
                100% { transform: translateX(400%); }
              }
            `}</style>
          </div>
        )}

        <MapView />
      </div>
    </div>
  );
}
