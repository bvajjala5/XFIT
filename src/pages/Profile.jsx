import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import GlassCard from '@/components/shared/GlassCard';
import { User, LogOut, Dumbbell, Clock, Flame } from 'lucide-react';

export default function Profile() {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();

  const { data: logs = [] } = useQuery({
    queryKey: ['workout-logs-profile', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const snap = await getDocs(query(collection(db, 'users', user.uid, 'workouts'), orderBy('completedAt', 'desc')));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    enabled: !!user
  });

  const totalWorkouts = logs.length;
  const totalMinutes = logs.reduce((acc, log) => acc + (Number(log.duration) || 0), 0);

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      <GlassCard className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-between justify-center text-primary">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{userData?.name || user?.displayName || 'User'}</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <button onClick={() => logout().then(() => navigate('/login'))} className="flex items-center gap-2 text-destructive hover:underline">
          <LogOut size={18} />
          Logout
        </button>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary"><Dumbbell /></div>
          <div>
            <p className="text-sm text-muted-foreground">Total Workouts</p>
            <p className="text-2xl font-bold">{totalWorkouts}</p>
          </div>
        </GlassCard>
        <GlassCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-chart-1/10 rounded-xl text-chart-1"><Clock /></div>
          <div>
            <p className="text-sm text-muted-foreground">Total Minutes</p>
            <p className="text-2xl font-bold">{totalMinutes}m</p>
          </div>
        </GlassCard>
        <GlassCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-chart-2/10 rounded-xl text-chart-2"><Flame /></div>
          <div>
            <p className="text-sm text-muted-foreground">Goal</p>
            <p className="text-xl font-semibold capitalize">{userData?.fitness_goal?.replace('_', ' ') || 'Not Set'}</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
