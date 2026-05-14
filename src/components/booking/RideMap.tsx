import * as React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supportedCities } from "../../content/siteContent";
import { Location, useBookingStore } from "../../store/useBookingStore";

// Leaflet icon fix
// @ts-ignore
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
// @ts-ignore
import markerIcon from "leaflet/dist/images/marker-icon.png";
// @ts-ignore
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

type City = (typeof supportedCities)[number];

const cityCenters: Record<City, [number, number]> = {
  Mumbai: [19.076, 72.8777],
  Delhi: [28.6139, 77.209],
  Bangalore: [12.9716, 77.5946],
  Hyderabad: [17.385, 78.4867],
  Pune: [18.5204, 73.8567],
};

const createCustomIcon = (color: string) => L.divIcon({
  className: "custom-marker",
  html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.88); box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.45), 0 8px 18px rgba(0, 0, 0, 0.28);"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const RecenterMap = ({
  city,
  pickup,
  destination,
}: {
  city: City;
  pickup?: Location;
  destination?: Location;
}) => {
  const map = useMap();

  React.useEffect(() => {
    if (pickup && destination) {
      const bounds = L.latLngBounds([pickup.lat, pickup.lng], [destination.lat, destination.lng]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (pickup) {
      map.setView([pickup.lat, pickup.lng], 14);
    } else {
      map.setView(cityCenters[city], 12);
    }
  }, [city, pickup, destination, map]);

  return null;
};

export const RideMap = ({ city }: { city: City }) => {
  const { currentRequest } = useBookingStore();
  const { pickup, destination } = currentRequest;
  const defaultPos = cityCenters[city];

  return (
    <MapContainer
      center={defaultPos}
      zoom={12}
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <ZoomControl position="bottomright" />

      {pickup && (
        <Marker position={[pickup.lat, pickup.lng]} icon={createCustomIcon("#FFFFFF")}>
          <Popup>Pickup: {pickup.address}</Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={[destination.lat, destination.lng]} icon={createCustomIcon("#99A1AF")}>
          <Popup>Destination: {destination.address}</Popup>
        </Marker>
      )}

      {pickup && destination && (
        <Polyline
          positions={[
            [pickup.lat, pickup.lng],
            [destination.lat, destination.lng],
          ]}
          color="#FFFFFF"
          weight={4}
          opacity={0.72}
          dashArray="10, 10"
        />
      )}

      <RecenterMap city={city} pickup={pickup} destination={destination} />
    </MapContainer>
  );
};
