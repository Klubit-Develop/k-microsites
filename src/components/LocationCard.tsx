import React, { useMemo } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';

interface LocationCardProps {
  title?: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  legalText?: string;
  onLegalClick?: () => void;
  className?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '224px',
  borderRadius: '4px',
};

const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

export const LocationCard: React.FC<LocationCardProps> = ({
  title,
  address,
  coordinates,
  legalText,
  onLegalClick,
  className = '',
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_MAPS_API_KEY,
  });

  const mapOptions = useMemo(
    () => ({
      styles: darkMapStyles,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
    }),
    []
  );

  const center = useMemo(() => coordinates, [coordinates]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-56 bg-[#1a1a1a] rounded-sm text-[#939393]">
        Error al cargar el mapa
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 items-start w-full ${className}`}>
      {/* Título */}
      {title && (
        <div className="flex gap-0.5 items-center px-1.5 w-full">
          <h2 className="text-[#ff336d] text-2xl font-semibold leading-[100%] whitespace-nowrap overflow-hidden text-ellipsis font-borna">
            {title}
          </h2>
        </div>
      )}

      {/* Tarjeta del mapa */}
      <div className="flex flex-col gap-3 items-start justify-center w-full p-3 bg-[#141414] border-2 border-[#232323] rounded-2xl shadow-[0px_4px_12px_0px_rgba(0,0,0,0.5)]">
        {/* Dirección */}
        <div className="flex gap-0.5 items-center px-1.5 w-full">
          <p className="text-[#f6f6f6] text-sm font-normal leading-[100%] flex-1 font-helvetica">
            {address}
          </p>
        </div>

        {/* Google Map */}
        <div className="relative w-full rounded-sm shadow-[0px_0px_12px_0px_rgba(0,0,0,0.5)] overflow-hidden">
          {!isLoaded ? (
            <div className="flex items-center justify-center h-56 bg-[#1a1a1a] rounded-sm">
              <div className="w-6 h-6 border-2 border-[#ff336d] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={15}
              options={mapOptions}
            >
              <Marker position={center} />
            </GoogleMap>
          )}
        </div>
      </div>

      {/* Texto legal */}
      {legalText && (
        <div className="flex gap-0.5 items-center px-1.5 w-full">
          <button
            onClick={onLegalClick}
            className="text-[#939393] text-xs font-medium leading-[100%] flex-1 text-left hover:text-[#b0b0b0] transition-colors cursor-pointer bg-transparent border-none p-0 font-helvetica"
          >
            {legalText}
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationCard;