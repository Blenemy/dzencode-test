'use client';

import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { useTranslations } from 'next-intl';
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { WarehouseDto } from '@dzen/shared';
import 'leaflet/dist/leaflet.css';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const FIT_PADDING: L.PointTuple = [28, 28];

function markerIcon(usersCount: number, selected: boolean): L.DivIcon {
  const size = selected ? 40 : 32;
  return L.divIcon({
    className: selected ? 'map-marker map-marker--selected' : 'map-marker',
    html: `<span class="map-marker__pin">${usersCount}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    tooltipAnchor: [size / 2, 0],
  });
}

function prefersReducedMotion(): boolean {
  return (
    document.documentElement.dataset.motion === 'reduced' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function FocusSelection({
  target,
  bounds,
}: {
  target: WarehouseDto | null;
  bounds: L.LatLngBounds;
}) {
  const map = useMap();

  useEffect(() => {
    const animate = !prefersReducedMotion();
    if (target) map.flyTo([target.latitude, target.longitude], 9, { animate, duration: 0.8 });
    else map.flyToBounds(bounds, { animate, duration: 0.8, padding: FIT_PADDING });
  }, [map, target, bounds]);

  return null;
}

interface WarehouseMapProps {
  warehouses: WarehouseDto[];
  selected: number | null;
  onSelect: (id: number) => void;
}

export function WarehouseMap({ warehouses, selected, onSelect }: WarehouseMapProps) {
  const t = useTranslations('users');
  const bounds = useMemo(
    () => L.latLngBounds(warehouses.map((warehouse) => [warehouse.latitude, warehouse.longitude])),
    [warehouses],
  );
  const target = warehouses.find((warehouse) => warehouse.id === selected) ?? null;

  return (
    <div className="warehouse-map" role="region" aria-label={t('mapLabel')}>
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: FIT_PADDING }}
        scrollWheelZoom={false}
        zoomSnap={0.5}
        className="warehouse-map__canvas"
      >
        <TileLayer url={TILE_URL} attribution={ATTRIBUTION} />
        <FocusSelection target={target} bounds={bounds} />
        {warehouses.map((warehouse) => (
          <Marker
            key={warehouse.id}
            position={[warehouse.latitude, warehouse.longitude]}
            icon={markerIcon(warehouse.usersCount, warehouse.id === selected)}
            title={warehouse.name}
            alt={warehouse.name}
            zIndexOffset={warehouse.id === selected ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(warehouse.id) }}
          >
            <Tooltip direction="right" offset={[6, 0]}>
              {warehouse.city}
            </Tooltip>
            <Popup>
              <strong className="warehouse-map__name">{warehouse.name}</strong>
              <span className="warehouse-map__address">
                {warehouse.city}, {warehouse.address}
              </span>
              <span className="warehouse-map__stats">
                {t('usersCount', { count: warehouse.usersCount })} ·{' '}
                {t('ordersCount', { count: warehouse.ordersCount })}
              </span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
