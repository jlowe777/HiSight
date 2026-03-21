import { create } from "zustand";
import type { Property } from "@/types/property";

interface MapStore {
  viewport: { lat: number; lng: number; zoom: number };
  selectedPoint: { lat: number; lng: number } | null;
  selectedProperty: Property | null;
  elevationFilter: [number, number]; // [min, max] in feet
  sidebarOpen: boolean;
  setSelectedPoint: (point: { lat: number; lng: number } | null) => void;
  setSelectedProperty: (property: Property | null) => void;
  setElevationFilter: (range: [number, number]) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  viewport: { lat: 39.7555, lng: -105.2211, zoom: 11 },
  selectedPoint: null,
  selectedProperty: null,
  elevationFilter: [5200, 6500], // feet — Full Range range
  sidebarOpen: false,

  setSelectedPoint: (point) => set({ selectedPoint: point }),
  setSelectedProperty: (property) =>
    set({ selectedProperty: property, sidebarOpen: property !== null }),
  setElevationFilter: (range) => set({ elevationFilter: range }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
