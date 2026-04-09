import React, { useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Clock3 } from 'lucide-react';

function Player({ url }) {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  const formatTime = (seconds) => {
    const date = new Date(seconds * 1000);
    const mm = date.getUTCMinutes();
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedPos = Math.max(0, Math.min(1, x / rect.width));
    setPlayed(clickedPos);
    playerRef.current.seekTo(clickedPos);
  };

  return (
    <div className="flex flex-col w-full h-full bg-black rounded-3xl border border-gray-800/50 overflow-hidden shadow-2xl">
      {/* 1. 영상 재생 영역: flex-1을 주어 남는 모든 공간을 차지하게 함 */}
      <div className="relative flex-1 bg-black min-h-0"> 
        <ReactPlayer
          ref={playerRef}
          url={url}
          width="100%"
          height="100%"
          playing={playing}
          muted={muted}
          onProgress={(s) => setPlayed(s.played)}
          onDuration={(d) => setDuration(d)}
          style={{ position: 'absolute', top: 0, left: 0 }}
          config={{ file: { attributes: { style: { objectFit: 'contain', width: '100%', height: '100%' } } } }}
        />
      </div>

      {/* 2. 컨트롤 바: 높이를 고정(shrink-0)하여 영상 영역을 침범하지 않게 함 */}
      <div className="bg-[#1C1F2E] px-6 py-4 flex flex-col gap-3 shrink-0 border-t border-gray-800/30">
        <div className="relative w-full h-1.5 bg-gray-700 rounded-full group cursor-pointer" onClick={handleSeek}>
          <div className="absolute top-0 left-0 h-full bg-brand-purple rounded-full shadow-[0_0_12px_#7C3AED]" style={{ width: `${played * 100}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full border-2 border-brand-purple opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${played * 100}% - 7px)` }} />
        </div>

        <div className="flex items-center justify-between text-gray-400">
          <div className="flex items-center gap-5">
            <button onClick={() => setPlaying(!playing)} className="text-white hover:text-brand-purple-light transition-colors">
              {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
            </button>
            <button onClick={() => playerRef.current.seekTo(0)} className="hover:text-white"><RotateCcw size={20} /></button>
            <div className="flex items-center gap-3 ml-2">
              <button onClick={() => setMuted(!muted)}>{muted ? <VolumeX size={20} className="text-red-500" /> : <Volume2 size={20} />}</button>
              <span className="text-[11px] font-mono text-gray-500">{formatTime(played * duration)} / {formatTime(duration)}</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 bg-gray-800 rounded hover:text-white transition-colors"><Clock3 size={14} /> 1.0x</button>
            <button className="hover:text-white"><Maximize size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Player;