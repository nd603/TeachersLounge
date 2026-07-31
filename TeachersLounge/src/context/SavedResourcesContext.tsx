import { createContext, useCallback, useContext, useState } from 'react';

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

export function SavedResourcesProvider({ children }: { children: React.ReactNode }) {
  const [savedResources, setSavedResources] = useState<Resource[]>([]);

  const toggleSave = useCallback((resource: Resource) => {
    setSavedResources(prev => {
      const exists = prev.some(r => r.id === resource.id);
      return exists ? prev.filter(r => r.id !== resource.id) : [resource, ...prev];
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
