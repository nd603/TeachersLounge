import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Resource = {
  id: string;
  title: string;
  price: string;
  creator: string;
  icon: string;
  bg: string;
};

type SavedResourcesContextType = {
  savedIds: Set<string>;
  savedResources: Resource[];
  toggleSave: (resource: Resource) => void;
  isSaved: (id: string) => boolean;
};

const SavedResourcesContext = createContext<SavedResourcesContextType>({
  savedIds: new Set(),
  savedResources: [],
  toggleSave: () => {},
  isSaved: () => false,
});

const STORAGE_KEY = 'savedResources';

export function SavedResourcesProvider({ children }: { children: React.ReactNode }) {
  const [savedResources, setSavedResources] = useState<Resource[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(json => {
      if (json) setSavedResources(JSON.parse(json));
    });
  }, []);

  const toggleSave = useCallback((resource: Resource) => {
    setSavedResources(prev => {
      const exists = prev.some(r => r.id === resource.id);
      const next = exists ? prev.filter(r => r.id !== resource.id) : [resource, ...prev];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const savedIds = new Set(savedResources.map(r => r.id));
  const isSaved = (id: string) => savedIds.has(id);

  return (
    <SavedResourcesContext.Provider value={{ savedIds, savedResources, toggleSave, isSaved }}>
      {children}
    </SavedResourcesContext.Provider>
  );
}

export function useSavedResources() {
  return useContext(SavedResourcesContext);
}
