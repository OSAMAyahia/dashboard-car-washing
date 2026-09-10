import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export interface Branch {
  id: string;
  name: string;
  laneCount: number;
  timezone: string;
  isActive: boolean;
  workingHours: { weekday: number; opensAt: string; closesAt: string; isClosed: boolean }[];
  _count?: { branchServices: number; staffLinks: number };
}

export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get<Branch[]>('/branches'),
  });
}
