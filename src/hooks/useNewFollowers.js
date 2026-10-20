import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { fetchFollowers, getLastSeenFollowers } from '@/lib/follows';
import { countNewFollowers } from '@/lib/followUtils';

/** Number of followers who arrived since the user last opened the Followers tab. Refreshes every minute. */
export function useNewFollowers() {
  const { user } = useAuth();
  const { data = 0 } = useQuery({
    queryKey: ['new-followers', user?.uid],
    queryFn: async () => countNewFollowers(await fetchFollowers(user.uid), getLastSeenFollowers(user.uid)),
    enabled: !!user,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  return data;
}
