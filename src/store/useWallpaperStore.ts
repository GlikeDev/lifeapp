import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const WALLPAPERS = [
  require('../../assets/wallpapers/283bd24c8a2a1e8cdc0db19436e53ae7.jpg'),
  require('../../assets/wallpapers/46bb89c0fa80534d47b8f4262c9ee976.jpg'),
  require('../../assets/wallpapers/79f7a877db05751a49f222c526714285.jpg'),
  require('../../assets/wallpapers/def34e18b382c923ef05ccd4b750df2c.jpg'),
];

interface WallpaperState {
  wallpaperId: number | null;
  setWallpaper: (id: number | null) => void;
}

export const useWallpaperStore = create<WallpaperState>()(
  persist(
    (set) => ({
      wallpaperId: null,
      setWallpaper: (id) => set({ wallpaperId: id }),
    }),
    {
      name: 'wallpaper-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
