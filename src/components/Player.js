import React, { useRef, useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { 
  Play, Pause, RotateCcw, Volume2, Volume1, 
  VolumeX, Maximize, Clock3 
} from 'lucide-react';

function Player({ url, onDuration, onProgress, playerRef }) {
  const [playing, setPlaying] = useState(false);
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
    if (isNaN(seconds)) return "00:00";
    const mm = Math.floor(seconds / 60);
    const ss = String(Math.floor(seconds % 60)).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const handleDragSeek = (e) => {
    if (!isDragging && e.type !== 'click') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const clickedPos = Math.max(0, Math.min(1, x / rect.width));
    setPlayed(clickedPos);
    onProgress(clickedPos);
    if (!isDragging) playerRef.current.seekTo(clickedPos);
  };

  const handleFullscreen = () => {
    const el = document.querySelector('.player-wrapper');
    if (el.requestFullscreen) el.requestFullscreen();
  };

  return (
    <div 
      className="player-wrapper group/main relative flex flex-col w-full h-full bg-black rounded-3xl shadow-2xl"
      onMouseMove={() => setShowControls(true)}
    >
      <div className="relative w-full h-full flex items-center justify-center rounded-3xl overflow-hidden"> 
        <ReactPlayer
          ref={playerRef}
          url={url}
          width="100%"
          height="100%"
          playing={playing}
          muted={muted}
          volume={volume}
          playbackRate={playbackRate}
          onProgress={(s) => { 
            if (!isDragging) {
              setPlayed(s.played);
              onProgress(s.played);
            }
            setPlayedSeconds(s.playedSeconds); 
          }}
          onDuration={(d) => {
            setDuration(d);
            onDuration(d);
          }}
          config={{ file: { attributes: { style: { objectFit: 'contain' } } } }}
        />
      </div>

      <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-500 z-30 ${showControls || isDragging ? 'opacity-100' : 'opacity-0'}`}>
        
        <div 
          className="relative w-full h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer group/bar"
          onMouseDown={() => setIsDragging(true)}
          onMouseMove={handleDragSeek}
          onMouseUp={() => { setIsDragging(false); playerRef.current.seekTo(played); }}
          onClick={handleDragSeek}
        >
          <div className="absolute top-0 left-0 h-full bg-brand-purple rounded-full shadow-[0_0_15px_#7C3AED]" style={{ width: `${played * 100}%` }} />
          <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transition-transform ${isDragging ? 'scale-125' : 'scale-0 group-hover/bar:scale-100'}`} style={{ left: `calc(${played * 100}% - 8px)` }} />
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-6">
            <button onClick={() => setPlaying(!playing)} className="hover:scale-110 transition-transform active:scale-95">
              {playing ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}
            </button>
            <button onClick={() => playerRef.current.seekTo(0)} className="opacity-80 hover:opacity-100 transition-opacity"><RotateCcw size={22} /></button>

            <div className="flex items-center gap-3 group/vol">
              <button onClick={() => setMuted(!muted)}>{muted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}</button>
              <input 
                type="range" min="0" max="1" step="0.1" value={muted ? 0 : volume}
                onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                className="w-0 group-hover/vol:w-20 transition-all accent-brand-purple cursor-pointer"
              />
              <span className="text-[13px] font-mono ml-1">{formatTime(playedSeconds)} / {formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* --- 배속 메뉴 수정 영역 --- */}
            <div className="relative group p-1"> {/* p-1로 감지 영역 확보 */}
              <button className="flex items-center gap-1.5 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all">
                <Clock3 size={16} /> {playbackRate === 1.0 ? 'Normal' : `${playbackRate}x`}
              </button>
              
              {/* 메뉴창: bottom 포지션을 조절하고 after 가상 요소를 더 넓게 배치 */}
              <div className="absolute bottom-[90%] left-1/2 -translate-x-1/2 pb-4 hidden group-hover:block z-[100] min-w-[100px]">
                <div className="bg-[#1C1F2E] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                  {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(rate => (
                    <button 
                      key={rate} 
                      onClick={() => {
                        setPlaybackRate(rate);
                        setShowControls(true);
                      }} 
                      className={`block w-full px-4 py-2.5 text-[11px] font-medium transition-colors border-b border-white/5 last:border-0
                        ${playbackRate === rate ? 'bg-brand-purple text-white' : 'hover:bg-white/10 text-gray-300'}
                      `}
                    >
                      {rate === 1.0 ? 'Normal' : `${rate}x`}
                    </button>
                  ))}
                </div>
                {/* 마우스가 이동할 수 있는 보이지 않는 가교 */}
                <div className="absolute top-full left-0 w-full h-6 bg-transparent" />
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
