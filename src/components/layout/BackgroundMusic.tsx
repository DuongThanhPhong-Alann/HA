"use client";

import { useEffect } from "react";

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

const getPlayer = () => {
  if (!player) {
    player = new Audio();
    player.preload = "auto";
    player.volume = 0.32;
  }
  return player;
};

export function BackgroundMusic({ preferredTrack }: { preferredTrack: MusicTrackId }) {
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
    const changePreference = (event: Event) => {
      const track = (event as CustomEvent<MusicTrackId>).detail;
      const index = MUSIC_TRACKS.findIndex((item) => item.id === track);
      if (index >= 0) {
        activePreference = track;
        loadTrack(index);
      }
    };
    const unlockPlayback = () => {
      void play();
      window.removeEventListener("pointerdown", unlockPlayback);
      window.removeEventListener("keydown", unlockPlayback);
    };

    audio.addEventListener("ended", playNext);
    window.addEventListener("bp-music-preference", changePreference);
    window.addEventListener("pointerdown", unlockPlayback, { once: true });
    window.addEventListener("keydown", unlockPlayback, { once: true });

    if (!audio.src || activePreference !== resolvedTrack) loadTrack(preferredIndex);
    else void play();
    activePreference = resolvedTrack;

    const { data: listener } = createClient().auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    return () => {
      audio.removeEventListener("ended", playNext);
      window.removeEventListener("bp-music-preference", changePreference);
      window.removeEventListener("pointerdown", unlockPlayback);
      window.removeEventListener("keydown", unlockPlayback);
      listener.subscription.unsubscribe();
    };
  }, [preferredTrack]);

  return null;
}
