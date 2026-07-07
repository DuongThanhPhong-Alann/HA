"use client";

import { Music2, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

import { text, type AppLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

export const MUSIC_TRACKS = [
  { id: "salt_and_bamboo", title: "Salt and Bamboo", src: "/music/salt-and-bamboo.mp3" },
  { id: "porcelain_sunlight", title: "Porcelain Sunlight", src: "/music/porcelain-sunlight.mp3" },
] as const;

export type MusicTrackId = (typeof MUSIC_TRACKS)[number]["id"];
const MUSIC_PREFERENCE_KEY = "bp-tracker:preferred-music";

export function persistMusicPreference(track: MusicTrackId) {
  localStorage.setItem(MUSIC_PREFERENCE_KEY, track);
  window.dispatchEvent(new CustomEvent<MusicTrackId>("bp-music-preference", { detail: track }));
}

let player: HTMLAudioElement | null = null;
let activeTrack = 0;
let activePreference: MusicTrackId | null = null;
let userPaused = false;

const getPlayer = () => {
  if (!player) {
    player = new Audio();
    player.preload = "auto";
    player.volume = 0.32;
  }
  return player;
};

export function BackgroundMusic({ preferredTrack, locale = "vi" }: { preferredTrack: MusicTrackId; locale?: AppLocale }) {
  const [isPlaying, setIsPlaying] = useState(() => Boolean(player && !player.paused));

  useEffect(() => {
    const audio = getPlayer();
    const storedTrack = localStorage.getItem(MUSIC_PREFERENCE_KEY);
    const resolvedTrack = MUSIC_TRACKS.some((track) => track.id === storedTrack) ? storedTrack as MusicTrackId : preferredTrack;
    const preferredIndex = Math.max(0, MUSIC_TRACKS.findIndex((track) => track.id === resolvedTrack));

    const play = () => audio.play().catch(() => undefined);
    const loadTrack = (index: number) => {
      activeTrack = index;
      audio.src = MUSIC_TRACKS[activeTrack].src;
      audio.load();
      void play();
    };
    const playNext = () => loadTrack((activeTrack + 1) % MUSIC_TRACKS.length);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const changePreference = (event: Event) => {
      const track = (event as CustomEvent<MusicTrackId>).detail;
      const index = MUSIC_TRACKS.findIndex((item) => item.id === track);
      if (index >= 0) {
        activePreference = track;
        userPaused = false;
        loadTrack(index);
      }
    };
    const unlockPlayback = () => {
      if (!userPaused) void play();
      window.removeEventListener("pointerdown", unlockPlayback);
      window.removeEventListener("keydown", unlockPlayback);
    };

    audio.addEventListener("ended", playNext);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    window.addEventListener("bp-music-preference", changePreference);
    window.addEventListener("pointerdown", unlockPlayback, { once: true });
    window.addEventListener("keydown", unlockPlayback, { once: true });

    if (!audio.src || activePreference !== resolvedTrack) loadTrack(preferredIndex);
    else if (!userPaused) void play();
    activePreference = resolvedTrack;

    const { data: listener } = createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        audio.pause();
        audio.currentTime = 0;
        userPaused = false;
      }
    });

    return () => {
      audio.removeEventListener("ended", playNext);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      window.removeEventListener("bp-music-preference", changePreference);
      window.removeEventListener("pointerdown", unlockPlayback);
      window.removeEventListener("keydown", unlockPlayback);
      listener.subscription.unsubscribe();
    };
  }, [preferredTrack]);

  const togglePlayback = () => {
    const audio = getPlayer();
    if (audio.paused) {
      userPaused = false;
      void audio.play();
    } else {
      userPaused = true;
      audio.pause();
    }
  };

  return <button type="button" className={`music-control ${isPlaying ? "music-control--playing" : ""}`} aria-label={isPlaying ? text(locale,"Dừng nhạc","Pause music") : text(locale,"Phát nhạc","Play music")} title={isPlaying ? text(locale,"Dừng nhạc","Pause music") : text(locale,"Phát nhạc","Play music")} onClick={togglePlayback}>
    <Music2 className="music-control__note" size={19}/>
    <span className="music-control__state">{isPlaying ? <Pause size={12}/> : <Play size={12}/>}</span>
    {isPlaying && <span className="music-control__pulse" aria-hidden="true"><i/><i/><i/></span>}
  </button>;
}
