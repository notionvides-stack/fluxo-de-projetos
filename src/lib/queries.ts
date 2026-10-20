import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Profile, Task } from "@/lib/domain";

export type TaskWithPerson = Task & { assignee: Pick<Profile, "id" | "full_name" | "avatar_url"> | null };

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("full_name");
      if (error) throw error;
      return data;
    },
  });
}

export function useTasks(week?: string) {
  return useQuery({
    queryKey: ["tasks", week ?? "all"],
    queryFn: async () => {
      let q = supabase.from("tasks").select("*, assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)").order("due_date", { ascending: true, nullsFirst: false });
      if (week) q = q.eq("week_start", week);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as TaskWithPerson[];
    },
  });
}

export function personName(t: TaskWithPerson) {
  return t.assignee?.full_name ?? t.demo_assignee_name ?? null;
}

export function useWeekPeriod(week: string) {
  return useQuery({
    queryKey: ["period", week],
    queryFn: async () => {
      const { data } = await supabase.from("weekly_periods").select("*").eq("week_start", week).maybeSingle();
      return data;
    },
  });
}
