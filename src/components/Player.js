import React, { useEffect, useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Clock3,
} from 'lucide-react';

function Player({
  url,
  onDuration = () => {},
  onProgress = () => {},
  playerRef,
  playing,
  setPlaying,
  objectPosition = 'center center',
}) {
  const wrapperRef = useRef(null);

  const [played, setPlayed] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    let timer;

    if (playing && showControls && !isDragging) {
      timer = setTimeout(() => setShowControls(false), 3000);
    }

    return () => clearTimeout(timer);
  }, [playing, showControls, isDragging]);

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '00:00:00';

    const date = new Date(seconds * 1000);
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');

    return `${hh}:${mm}:${ss}`;
  };

  const getSeekPosition = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const x = clientX - rect.left;

    return Math.max(0, Math.min(1, x / rect.width));
  };

  const handleSeekMove = (e) => {
    if (!isDragging && e.type !== 'click') return;

    const nextPlayed = getSeekPosition(e);
    setPlayed(nextPlayed);
    onProgress(nextPlayed);

    if (e.type === 'click' && playerRef?.current) {
      playerRef.current.seekTo(nextPlayed, 'fraction');
    }
  };

  const handleSeekEnd = () => {
    setIsDragging(false);

    if (playerRef?.current) {
      playerRef.current.seekTo(played, 'fraction');
    }
  };

  const handleFullscreen = (e) => {
    e.stopPropagation();

    const el = wrapperRef.current;

    if (!el) return;

    if (el.requestFullscreen) {
      el.requestFullscreen();
    }
  };

  if (!url) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center text-slate-400">
        영상을 불러올 수 없습니다.
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="player-wrapper relative w-full h-full bg-black overflow-hidden group"
      onMouseMove={() => setShowControls(true)}
      onMouseEnter={() => setShowControls(true)}
    >
      <ReactPlayer
        ref={playerRef}
        url={url}
        width="100%"
        height="100%"
        playing={playing}
        volume={volume}
        muted={muted}
        playbackRate={playbackRate}
        controls={false}
        onClick={() => setPlaying(!playing)}
        onProgress={(state) => {
          if (!isDragging) {
            setPlayed(state.played);
            onProgress(state.played);
          }

          setPlayedSeconds(state.playedSeconds);
        }}
        onDuration={(d) => {
          setDuration(d);
          onDuration(d);
        }}
        config={{
          file: {
            attributes: {
              style: {
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: objectPosition,
                backgroundColor: 'black',
                display: 'block',
              },
            },
          },
        }}
      />

      <div
        className={`absolute inset-x-0 bottom-0 px-8 pb-7 pt-12 bg-gradient-to-t from-black/90 via-black/45 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="w-full h-2 rounded-full bg-white/20 cursor-pointer mb-6 relative overflow-hidden"
          onMouseDown={(e) => {
            setIsDragging(true);
            handleSeekMove(e);
          }}
          onMouseMove={handleSeekMove}
          onMouseUp={handleSeekEnd}
          onMouseLeave={() => {
            if (isDragging) handleSeekEnd();
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleSeekMove(e);
          }}
        >
          <div
            className="absolute left-0 top-0 h-full bg-brand-purple"
            style={{ width: `${played * 100}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPlaying(!playing);
              }}
              className="hover:scale-110 active:scale-95 transition-transform"
            >
              {playing ? (
                <Pause size={34} />
              ) : (
                <Play size={34} fill="currentColor" />
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();

                if (playerRef?.current) {
                  playerRef.current.seekTo(0, 'fraction');
                }

                setPlayed(0);
                setPlayedSeconds(0);
                onProgress(0);
              }}
              className="opacity-80 hover:opacity-100"
            >
              <RotateCcw size={28} />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMuted(!muted);
                }}
                className="hover:text-brand-purple transition-colors pr-2"
              >
                {muted || volume === 0 ? (
                  <VolumeX size={26} />
                ) : volume < 0.5 ? (
                  <Volume1 size={26} />
                ) : (
                  <Volume2 size={26} />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setMuted(false);
                }}
                className="w-20 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer accent-brand-purple"
              />
            </div>

            <div className="font-mono text-sm tracking-widest">
              {formatTime(playedSeconds)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative group/rate">
              <button
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-bold"
              >
                <Clock3 size={18} />
                {playbackRate === 1.0 ? 'Normal' : `${playbackRate}x`}
              </button>

              <div className="absolute right-0 bottom-full mb-2 w-28 rounded-xl overflow-hidden bg-black/90 border border-white/10 hidden group-hover/rate:block">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      setShowControls(true);
                    }}
                    className={`block w-full px-4 py-2.5 text-[11px] font-medium border-b border-white/5 last:border-0 ${
                      playbackRate === rate
                        ? 'bg-brand-purple text-white'
                        : 'hover:bg-white/10 text-gray-300'
                    }`}
                  >
                    {rate === 1.0 ? 'Normal' : `${rate}x`}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleFullscreen}
              className="hover:scale-110 transition-transform"
            >
              <Maximize size={28} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Player;
