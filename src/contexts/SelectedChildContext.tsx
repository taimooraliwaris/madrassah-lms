import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMyChildren, type ChildStudent } from "@/hooks/queries";

type Ctx = {
  children: ChildStudent[];
  selectedChild: ChildStudent | null;
  setSelectedChildId: (id: string) => void;
  loading: boolean;
};

const SelectedChildContext = createContext<Ctx | undefined>(undefined);

const STORAGE_KEY = "parent.selectedChildId";

export function SelectedChildProvider({ children }: { children: ReactNode }) {
  const { data = [], isLoading } = useMyChildren();
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem(STORAGE_KEY),
  );

  // Ensure selectedId is valid once data loads
  useEffect(() => {
    if (!data.length) return;
    const exists = selectedId && data.some((c) => c.id === selectedId);
    if (!exists) {
      const fallback = data[0].id;
      setSelectedId(fallback);
      localStorage.setItem(STORAGE_KEY, fallback);
    }
  }, [data, selectedId]);

  const setSelectedChildId = (id: string) => {
    setSelectedId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const selectedChild = useMemo(
    () => data.find((c) => c.id === selectedId) ?? null,
    [data, selectedId],
  );

  return (
    <SelectedChildContext.Provider
      value={{ children: data, selectedChild, setSelectedChildId, loading: isLoading }}
    >
      {children}
    </SelectedChildContext.Provider>
  );
}

export function useSelectedChild() {
  const ctx = useContext(SelectedChildContext);
  if (!ctx) throw new Error("useSelectedChild must be inside SelectedChildProvider");
  return ctx;
}
