import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { followUser, unfollowUser, fetchFollowers, fetchFollowing, repairFollowerLinks, getLastSeenFollowers, markFollowersSeen } from "@/lib/follows";
import { sortByRecent, toMillis } from "@/lib/followUtils";
import { useAuth } from "@/lib/AuthContext";
import { UserPlus, UserMinus, Search, Users, Flame, Dumbbell, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import GlassCard from "@/components/shared/GlassCard";
import { calcStreak } from "@/lib/utils";

function UserCard({ profile, isFollowing, onToggle, isNew = false, busy = false, followBack = false }) {
  return (
    <GlassCard className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {profile.photoURL ? <img src={profile.photoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-lg font-black text-primary">{(profile.displayName||"?")[0]}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{profile.displayName || "XFit User"}{isNew && <span className="ml-2 align-middle text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">NEW</span>}</p>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Dumbbell className="w-3 h-3" />{profile.totalWorkouts || 0} workouts</span>
          <span className="flex items-center gap-1 text-xs text-orange-400"><Flame className="w-3 h-3" />{profile.streak || 0} streak</span>
        </div>
      </div>
      <button onClick={() => onToggle(profile)} disabled={busy}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isFollowing ? "bg-secondary/50 text-muted-foreground hover:bg-destructive/20 hover:text-destructive" : "bg-primary/20 text-primary hover:bg-primary/30"}`}>
        {isFollowing ? <><UserMinus className="w-3 h-3" />Unfollow</> : <><UserPlus className="w-3 h-3" />{followBack ? "Follow back" : "Follow"}</>}
      </button>
    </GlassCard>
  );
}

export default function Friends() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const initialTab = ["following", "followers", "discover"].includes(params.get("tab")) ? params.get("tab") : "following";
  const [tab, setTab] = useState(initialTab);
  const [search, setSearch] = useState("");
  const [busyUid, setBusyUid] = useState(null);
  const qc = useQueryClient();
  const me = { uid: user?.uid, displayName: user?.displayName?.split(" ")[0] || "XFit User" };

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["leaderboard-all"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "leaderboard"));
      return snap.docs.map(d => ({ uid: d.id, ...d.data() })).filter(u => u.uid !== user?.uid);
    },
    enabled: !!user,
  });

  const { data: followingDocs = [], isSuccess: followingLoaded } = useQuery({
    queryKey: ["following", user?.uid],
    queryFn: () => fetchFollowing(user.uid),
    enabled: !!user,
    refetchOnWindowFocus: true,
  });
  const following = followingDocs.map(d => d.id);

  const { data: followerDocs = [] } = useQuery({
    queryKey: ["followers", user?.uid],
    queryFn: async () => sortByRecent(await fetchFollowers(user.uid)),
    enabled: !!user,
    refetchOnWindowFocus: true,
  });

  // "NEW" badges are based on the last time the Followers tab was opened. Capture that moment once, then mark seen.
  const lastSeen = useRef(getLastSeenFollowers(user?.uid));
  useEffect(() => {
    if (tab === "followers" && user) {
      const t = setTimeout(() => { markFollowersSeen(user.uid); qc.invalidateQueries({ queryKey: ["new-followers"] }); }, 1500);
      return () => clearTimeout(t);
    }
  }, [tab, user, qc]);

  // Fix follows made before this update (their "followers" record was never written).
  useEffect(() => {
    if (user && followingLoaded && followingDocs.length) repairFollowerLinks(me, followingDocs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, followingLoaded]);

  const refreshAll = () => {
    ["following", "followers", "following-count", "follower-count", "new-followers"].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
  };

  const handleToggle = async (profile) => {
    if (busyUid) return;
    setBusyUid(profile.uid);
    try {
      if (following.includes(profile.uid)) await unfollowUser(me, profile.uid);
      else await followUser(me, profile);
      refreshAll();
    } catch (err) {
      console.error("follow error", err);
      toast.error(err?.code === "permission-denied"
        ? "Couldn't update follow — database rules blocked it. (permission-denied)"
        : `Couldn't update follow: ${err?.message || "unknown error"}`);
    } finally {
      setBusyUid(null);
    }
  };

  const byUid = new Map(leaderboard.map(u => [u.uid, u]));
  // Merge the stored follow record (always has a name) with leaderboard stats when available.
  const toProfile = (d) => ({ ...(byUid.get(d.id) || {}), uid: d.id, displayName: byUid.get(d.id)?.displayName || d.displayName });

  const filtered = leaderboard.filter(u => !search || (u.displayName || "").toLowerCase().includes(search.toLowerCase()));
  const followingProfiles = followingDocs.map(toProfile);
  const followerProfiles = followerDocs.map(toProfile);
  const displayed = tab === "following" ? followingProfiles : tab === "followers" ? followerProfiles : filtered;
  const newCount = followerDocs.filter(f => toMillis(f.followedAt) > lastSeen.current).length;

  const emptyCopy = {
    following: ["Not following anyone yet", "Switch to Discover to find people!"],
    followers: ["No followers yet", "When someone follows you, they'll show up here."],
    discover: ["No users found", "Try a different search"],
  }[tab];

  return (
    <div className="max-w-2xl mx-auto pb-28 px-4 pt-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center"><Users className="w-5 h-5 text-blue-500" /></div>
        <div><h1 className="text-xl font-black">Friends</h1><p className="text-xs text-muted-foreground">Follow others and compete together</p></div>
      </div>

      <div className="flex gap-2">
        {["following", "followers", "discover"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`relative flex-1 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${tab === t ? "bg-primary/20 text-primary" : "bg-secondary/30 text-muted-foreground"}`}>
            {t === "following" ? `Following (${following.length})` : t === "followers" ? `Followers (${followerDocs.length})` : "Discover"}
            {t === "followers" && newCount > 0 && tab !== "followers" && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{newCount}</span>
            )}
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
            <p className="font-semibold">{emptyCopy[0]}</p>
            <p className="text-sm text-muted-foreground mt-1">{emptyCopy[1]}</p>
            {tab === "following" && <button onClick={() => setTab("discover")} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold">Discover Users</button>}
          </GlassCard>
        )}
        {displayed.map((profile, i) => (
          <motion.div key={profile.uid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <UserCard profile={profile} isFollowing={following.includes(profile.uid)} onToggle={handleToggle} busy={busyUid === profile.uid}
              isNew={tab === "followers" && toMillis(followerDocs.find(f => f.id === profile.uid)?.followedAt) > lastSeen.current}
              followBack={tab === "followers"} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}