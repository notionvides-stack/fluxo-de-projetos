import { createContext, useContext, useState, type ReactNode } from "react";
import { mondayOf } from "@/lib/domain";

type WeekCtx = { week: string; setWeek: (w: string) => void; search: string; setSearch: (s: string) => void };
const Ctx = createContext<WeekCtx>({ week: mondayOf(new Date()), setWeek: () => {}, search: "", setSearch: () => {} });

export function WeekProvider({ children }: { children: ReactNode }) {
  const [week, setWeek] = useState(() => mondayOf(new Date()));
  const [search, setSearch] = useState("");
  return <Ctx.Provider value={{ week, setWeek, search, setSearch }}>{children}</Ctx.Provider>;
}
export const useWeek = () => useContext(Ctx);
