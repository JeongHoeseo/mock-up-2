import React, { useRef, useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, RotateCcw, Volume2, Volume1, VolumeX, Maximize, Clock3 } from 'lucide-react';

function Player({ url }) {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // 자동 컨트롤러 숨김 로직
  useEffect(() => {
    let timer;
    if (playing && showControls) {
      timer = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timer);
  }, [playing, showControls]);

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00";
    const mm = Math.floor(seconds / 60);
    const ss = String(Math.floor(seconds % 60)).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  // 드래그 시크 기능 (마우스 이동 시 실시간 계산)
  const handleDragSeek = (e) => {
    if (!isDragging && e.type !== 'click') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const clickedPos = Math.max(0, Math.min(1, x / rect.width));
    setPlayed(clickedPos);
    if (!isDragging) playerRef.current.seekTo(clickedPos);
  };

  const handleFullscreen = () => {
    const el = document.querySelector('.player-wrapper');
    if (el.requestFullscreen) el.requestFullscreen();
  };

  return (
    <div 
      className="player-wrapper group relative flex flex-col w-full h-full bg-black rounded-3xl overflow-hidden shadow-2xl"
      onMouseMove={() => setShowControls(true)}
    >
      {/* 1. 메인 영상 영역 */}
      <div className="relative w-full h-full flex items-center justify-center"> 
        <ReactPlayer
          ref={playerRef}
          url={url}
          width="100%"
          height="100%"
          playing={playing}
          muted={muted}
          volume={volume}
          playbackRate={playbackRate}
          onProgress={(s) => { if (!isDragging) setPlayed(s.played); setPlayedSeconds(s.playedSeconds); }}
          onDuration={(d) => setDuration(d)}
          config={{ file: { attributes: { style: { objectFit: 'contain' } } } }}
        />
      </div>

      {/* 2. 유튜브 스타일 투명 컨트롤러 (Overlay) */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* 드래그 가능한 재생바 */}
        <div 
          className="relative w-full h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer group/bar"
          onMouseDown={() => setIsDragging(true)}
          onMouseMove={handleDragSeek}
          onMouseUp={() => { setIsDragging(false); playerRef.current.seekTo(played); }}
          onClick={handleDragSeek}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-brand-purple rounded-full shadow-[0_0_15px_#7C3AED]" 
            style={{ width: `${played * 100}%` }} 
          />
          <div 
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-transform ${isDragging ? 'scale-125' : 'scale-0 group-hover/bar:scale-100'}`}
            style={{ left: `calc(${played * 100}% - 8px)` }}
          />
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-6">
            <button onClick={() => setPlaying(!playing)} className="hover:scale-110 transition-transform">
              {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            <button onClick={() => playerRef.current.seekTo(0)} className="opacity-80 hover:opacity-100"><RotateCcw size={20} /></button>

            <div className="flex items-center gap-3 group/volume">
              <button onClick={() => setMuted(!muted)}>{muted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}</button>
              <input 
                type="range" min="0" max="1" step="0.1" value={muted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-0 group-hover/volume:w-20 transition-all accent-brand-purple"
              />
              <span className="text-xs font-medium ml-2">{formatTime(playedSeconds)} / {formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* 배속 기능 구현 */}
            <div className="relative group/speed">
              <button className="flex items-center gap-1.5 text-xs font-bold bg-white/10 px-2 py-1 rounded hover:bg-white/20 transition-colors">
                <Clock3 size={16} /> {playbackRate}x
              </button>
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#161927] border border-white/10 rounded-lg hidden group-hover/speed:block overflow-hidden shadow-xl">
                {[0.5, 1.0, 1.5, 2.0].map(rate => (
                  <button key={rate} onClick={() => setPlaybackRate(rate)} className="block w-full px-4 py-2 text-xs hover:bg-brand-purple transition-colors">
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleFullscreen} className="hover:scale-110 transition-transform"><Maximize size={22} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Player;
