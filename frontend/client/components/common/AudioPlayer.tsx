"use client";

import { useState, useRef, useEffect } from "react";

interface AudioPlayerProps {
  src: string;
  playLimit?: number; // 재생 횟수 제한 (기본 2회)
  className?: string;
  autoPlay?: boolean;
}

export default function AudioPlayer({ src, playLimit = 2, className = "", autoPlay = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [isDisabled, setIsDisabled] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setPlayCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= playLimit) {
          setIsDisabled(true);
        }
        return newCount;
      });
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [playLimit]);

  useEffect(() => {
    if (autoPlay && audioRef.current && playCount === 0) {
      audioRef.current.play().catch(() => {
        // 자동 재생 실패 시 무시 (브라우저 정책)
      });
    }
  }, [autoPlay, playCount]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch((error) => {
        console.error("오디오 재생 실패:", error);
      });
      setIsPlaying(true);
    }
  };

  const handleReplay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    audio.play().catch((error) => {
      console.error("오디오 재생 실패:", error);
    });
    setIsPlaying(true);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const remainingPlays = playLimit - playCount;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center gap-4">
        {/* 재생/일시정지 버튼 */}
        <button
          onClick={handlePlayPause}
          disabled={isDisabled}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isDisabled
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : isPlaying
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
          aria-label={isPlaying ? "일시정지" : "재생"}
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 4h4v12H6V4zm4 0h4v12h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.5 4l9 6-9 6V4z" />
            </svg>
          )}
        </button>

        {/* 재생 바 */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-600 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            {remainingPlays > 0 && (
              <span className="text-xs text-gray-500">
                (남은 재생: {remainingPlays}회)
              </span>
            )}
            {isDisabled && (
              <span className="text-xs text-red-600 font-semibold">
                재생 횟수 초과
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{
                width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
              }}
            />
          </div>
        </div>

        {/* 다시 듣기 버튼 */}
        {!isDisabled && (
          <button
            onClick={handleReplay}
            disabled={isDisabled}
            className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="다시 듣기"
          >
            다시 듣기
          </button>
        )}
      </div>

      {/* 숨겨진 오디오 엘리먼트 */}
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}

