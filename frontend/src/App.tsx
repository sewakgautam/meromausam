import { useEffect } from 'react';
import { api } from './utils/api';
import { useStore } from './stores/appStore';
import TopBar from './components/TopBar';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import AlertBanner from './components/AlertBanner';
import StatsBar from './components/StatsBar';
import LayerControls from './components/LayerControls';

export default function App() {
  const { setOverview, setMapData, setAlerts, setLoading } = useStore();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [overview, mapData, alerts] = await Promise.all([
          api.getOverview().catch(() => null),
          api.getMapData().catch(() => []),
          api.getAlerts().catch(() => []),
        ]);
        if (overview) setOverview(overview);
        setMapData(mapData || []);
        setAlerts(alerts || []);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Refresh every 15 minutes
    const interval = setInterval(loadData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#0a1628' }}>
      {/* Full-screen map */}
      <MapView />

      {/* Top navigation bar */}
      <TopBar />

      {/* Alert banner for severe weather */}
      <AlertBanner />

      {/* Stats strip at bottom */}
      <StatsBar />

      {/* Layer toggle controls */}
      <LayerControls />

      {/* Right sidebar - forecast/alerts/subscribe */}
      <Sidebar />
    </div>
  );
}
