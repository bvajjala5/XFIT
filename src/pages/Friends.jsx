import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, setDoc, deleteDoc, getDoc, orderBy, updateDoc, increment } from "firebase/firestore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { UserPlus, UserMinus, Search, Users, Flame, Dumbbell, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import GlassCard from "@/components/shared/GlassCard";
import { calcStreak } from "@/lib/utils";

function UserCard({ profile, isFollowing, onToggle }) {
  return (
    <GlassCard className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {profile.photoURL ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-lg font-black text-primary">{(profile.displayName||"?")[0]}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{profile.displayName || "XFit User"}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Dumbbell className="w-3 h-3" />{profile.totalWorkouts || 0} workouts</span>
          <span className="flex items-center gap-1 text-xs text-orange-400"><Flame className="w-3 h-3" />{profile.streak || 0} streak</span>
        </div>
      </div>
      <button onClick={() => onToggle(profile)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isFollowing ? "bg-secondary/50 text-muted-foreground hover:bg-destructive/20 hover:text-destructive" : "bg-primary/20 text-primary hover:bg-primary/30"}`}>
        {isFollowing ? <><UserMinus className="w-3 h-3" />Unfollow</> : <><UserPlus className="w-3 h-3" />Follow</>}
      </button>
    </GlassCard>
  );
}

export default function Friends() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("following");
  const qc = useQueryClient();

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard-all"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "leaderboard"));
      return snap.docs.map(d => ({ uid: d.id, ...d.data() })).filter(u => u.uid !== user?.uid);
    },
    enabled: !!user,
  });

  const { data: following = [] } = useQuery({
    queryKey: ["following", user?.uid],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "users", user.uid, "following"));
      return snap.docs.map(d => d.id);
    },
    enabled: !!user,
  });

  const handleToggle = async (profile) => {
    const followingRef = doc(db, "users", user.uid, "following", profile.uid);
    const theirLbRef = doc(db, "leaderboard", profile.uid);
    if (following.includes(profile.uid)) {
      await deleteDoc(followingRef);
      // Decrement their follower count on the leaderboard doc (safe — leaderboard is public)
      try { await updateDoc(theirLbRef, { followerCount: increment(-1) }); } catch (e) {}
    } else {
      await setDoc(followingRef, { displayName: profile.displayName, uid: profile.uid, followedAt: new Date() });
      // Increment their follower count
      try { await updateDoc(theirLbRef, { followerCount: increment(1) }); } catch (e) {}
    }
    qc.invalidateQueries({ queryKey: ["following"] });
    qc.invalidateQueries({ queryKey: ["follower-count", profile.uid] });
  };

  const filtered = leaderboard.filter(u =>
    !search || (u.displayName || "").toLowerCase().includes(search.toLowerCase())
  );

  const followingProfiles = leaderboard.filter(u => following.includes(u.uid));
  const displayed = tab === "following" ? followingProfiles : filtered;

  return (
    <div className="max-w-2xl mx-auto pb-28 px-4 pt-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center"><Users className="w-5 h-5 text-blue-500" /></div>
        <div><h1 className="text-xl font-black">Friends</h1><p className="text-xs text-muted-foreground">Follow others and compete together</p></div>
      </div>

      <div className="flex gap-2">
        {["following","discover"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${tab === t ? "bg-primary/20 text-primary" : "bg-secondary/30 text-muted-foreground"}`}>
            {t === "following" ? `Following (${following.length})` : "Discover"}
          </button>
        ))}
      </div>

      {tab === "discover" && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
            className="w-full bg-secondary/40 border border-border/40 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary/50" />
        </div>
      )}

      <div className="space-y-2">
        {displayed.length === 0 && (
          <GlassCard className="text-center py-10">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold">{tab === "following" ? "Not following anyone yet" : "No users found"}</p>
            <p className="text-sm text-muted-foreground mt-1">{tab === "following" ? "Switch to Discover to find people!" : "Try a different search"}</p>
            {tab === "following" && <button onClick={() => setTab("discover")} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold">Discover Users</button>}
          </GlassCard>
        )}
        {displayed.map((profile, i) => (
          <motion.div key={profile.uid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <UserCard profile={profile} isFollowing={following.includes(profile.uid)} onToggle={handleToggle} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}