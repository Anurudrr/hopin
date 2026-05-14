import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { User, Navigation } from 'lucide-react';

// Custom Map Marker Icons using Lucide rendered to static HTML for Leaflet
const createCustomIcon = (
  IconComponent: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>,
  colorStyle: string,
  bgStyle: string,
  isSquare: boolean = false
) => {
  const iconHtml = renderToStaticMarkup(
    <div style={{
      width: 32, height: 32, 
      borderRadius: isSquare ? '0' : '50%',
      background: bgStyle, 
      border: '3px solid black',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: colorStyle, 
      boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
    }}>
      <IconComponent size={18} strokeWidth={2.5} />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const userIcon = createCustomIcon(User, '#FFFFFF', '#000000', true); // Black square
const driverIcon = createCustomIcon(Navigation, '#000000', '#FFFFFF', false); // White circle

const MapExperience = () => {
  const position: [number, number] = [12.9716, 77.5946]; // Bangalore center

  const routePositions: [number, number][] = [
    [12.9716, 77.5946],
    [12.9750, 77.6000],
    [12.9800, 77.6100],
    [12.9850, 77.6200],
  ];

  return (
    <section className="py-32 bg-white border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-5xl md:text-7xl font-black text-black tracking-tighter uppercase mb-6">
            See Who's<br/>Going Your Way.
          </h2>
          <p className="text-xl text-black font-medium">
            Real-time tracking with zero distractions. Just you, your driver, and the route.
          </p>
        </div>

        <div className="h-[600px] w-full bg-white overflow-hidden shadow-premium border-4 border-black relative z-0">
          <MapContainer 
            center={position} 
            zoom={13} 
            scrollWheelZoom={false}
            className="h-full w-full"
            zoomControl={false}
          >
            {/* Minimal Map Tile Provider - CartoDB Positron */}
            {/* CSS filter in index.css makes this 100% grayscale and high contrast */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            
            <Polyline 
              positions={routePositions} 
              pathOptions={{ color: '#000000', weight: 6, dashArray: '12 12' }} 
            />

            <Marker position={[12.9716, 77.5946]} icon={userIcon}>
              <Popup className="custom-popup">
                <div className="text-center font-sans border-2 border-black p-2 bg-white">
                  <p className="font-bold uppercase tracking-widest text-xs text-black">You are here</p>
                </div>
              </Popup>
            </Marker>

            <Marker position={[12.9800, 77.6100]} icon={driverIcon}>
              <Popup className="custom-popup">
                <div className="font-sans border-2 border-black p-2 bg-white">
                  <p className="font-bold uppercase tracking-widest text-xs text-black">Nearby Driver</p>
                  <p className="font-black text-black text-sm">2 MINS</p>
                </div>
              </Popup>
            </Marker>

             <Marker position={[12.9650, 77.5800]} icon={driverIcon} />
             <Marker position={[12.9850, 77.5900]} icon={driverIcon} />
             <Marker position={[12.9780, 77.5750]} icon={userIcon} />

          </MapContainer>

          {/* Map Overlay UI */}
          <div className="absolute top-8 left-8 z-[1000] bg-white px-6 py-4 border-4 border-black shadow-soft flex items-center space-x-3">
            <span className="w-3 h-3 bg-black animate-pulse"></span>
            <span className="text-sm font-bold uppercase tracking-widest text-black">12 rides near you</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapExperience;
