import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 28.6139,
  lng: 77.2090
};

const LiveTracking = () => {
  const [currentPosition, setCurrentPosition] = useState(center);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  });

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentPosition({
            lat: latitude,
            lng: longitude
          });
        },
        (error) => console.error("Error watching position:", error),
        { enableHighAccuracy: true }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  if (!isLoaded) return <div className="h-full w-full bg-gray-200 flex items-center justify-center">Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={currentPosition}
      zoom={15}
      options={{
        disableDefaultUI: true,
        zoomControl: false
      }}
    >
      {/* MarkerF fixes the Marker deprecation & gmp-pin duplicate element warning */}
      <MarkerF position={currentPosition} />
    </GoogleMap>
  );
};

export default LiveTracking;