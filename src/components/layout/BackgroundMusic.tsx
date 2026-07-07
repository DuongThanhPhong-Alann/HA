"use client";

import { Check, Music2, Pause, Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
const MUSIC_STATE_EVENT = "bp-music-state";

function notifyMusicState() {
  window.dispatchEvent(new CustomEvent(MUSIC_STATE_EVENT, { detail: { playing: Boolean(player && !player.paused), track: MUSIC_TRACKS[activeTrack].id } }));
}

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
      notifyMusicState();
      void play();
    };
    const playNext = () => loadTrack((activeTrack + 1) % MUSIC_TRACKS.length);
    const onPlay = () => notifyMusicState();
    const onPause = () => notifyMusicState();
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

  return null;
}

export function MusicControl({ userId, locale = "vi", mobile = false }: { userId: string; locale?: AppLocale; mobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(() => Boolean(player && !player.paused));
  const [selectedTrack, setSelectedTrack] = useState<MusicTrackId>(() => MUSIC_TRACKS[activeTrack].id);

  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent<{ playing: boolean; track: MusicTrackId }>).detail;
      setIsPlaying(detail.playing);
      setSelectedTrack(detail.track);
    };
    window.addEventListener(MUSIC_STATE_EVENT, update);
    return () => window.removeEventListener(MUSIC_STATE_EVENT, update);
  }, []);

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

  const chooseTrack = async (track: MusicTrackId) => {
    setSelectedTrack(track);
    persistMusicPreference(track);
    setOpen(false);
    const { error } = await createClient().from("profiles").update({ preferred_music: track }).eq("id", userId);
    if (error) toast.warning(text(locale,"Đã đổi nhạc trên thiết bị này","Music changed on this device"));
  };

  return <div className={`music-menu ${mobile ? "music-menu--mobile" : ""}`}>
    <button type="button" className={mobile ? "music-menu__trigger music-menu__trigger--mobile" : "music-menu__trigger"} aria-label={text(locale,"Điều khiển âm nhạc","Music controls")} onClick={() => setOpen((value) => !value)}>
      <span className="music-menu__icon"><Music2 size={mobile ? 19 : 18}/>{isPlaying && <i/>}</span>
      <span className={mobile ? "line-clamp-1 w-full" : "music-menu__label"}>{text(locale,"Âm nhạc","Music")}</span>
    </button>
    {open && <div className="music-menu__panel">
      <div className="music-menu__head"><span><Music2 size={17}/>{text(locale,"Âm nhạc thư giãn","Ambient music")}</span><button type="button" aria-label={text(locale,"Đóng","Close")} onClick={() => setOpen(false)}><X size={16}/></button></div>
      <button type="button" className="music-menu__playback" onClick={togglePlayback}><span>{isPlaying ? <Pause size={16}/> : <Play size={16}/>}</span><b>{isPlaying ? text(locale,"Dừng nhạc","Pause music") : text(locale,"Phát nhạc","Play music")}</b></button>
      <p>{text(locale,"Chọn bài phát ngay","Choose a track to play now")}</p>
      <div className="music-menu__tracks">{MUSIC_TRACKS.map((track) => <button key={track.id} type="button" className={selectedTrack === track.id ? "is-active" : ""} onClick={() => void chooseTrack(track.id)}><span><Music2 size={14}/>{track.title}</span>{selectedTrack === track.id && <Check size={15}/>}</button>)}</div>
    </div>}
  </div>;
}
