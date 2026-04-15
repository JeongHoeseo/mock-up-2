import React, { useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, RotateCcw, Volume2, Volume1, VolumeX, Maximize, Clock3 } from 'lucide-react';

function Player({ url }) {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8); // 기본 볼륨 80%

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00";
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    if (hh > 0) return `${hh}:${String(mm).padStart(2, '0')}:${ss}`;
    return `${mm}:${ss}`;
  };

  // 볼륨 아이콘 동적 변경 로직
  const getVolumeIcon = () => {
    if (muted || volume === 0) return <VolumeX size={20} className="text-red-500" />;
    if (volume < 0.5) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
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
      <div className="relative flex-1 bg-black min-h-0"> 
        <ReactPlayer
          ref={playerRef}
          url={url}
          width="100%"
          height="100%"
          playing={playing}
          muted={muted}
          volume={volume} // 볼륨 상태 연결
          onProgress={(s) => {
            setPlayed(s.played);
            setPlayedSeconds(s.playedSeconds);
          }}
          onDuration={(d) => setDuration(d)}
          style={{ position: 'absolute', top: 0, left: 0 }}
          config={{ file: { attributes: { style: { objectFit: 'contain' } } } }}
        />
      </div>

      <div className="bg-[#1C1F2E] px-6 py-4 flex flex-col gap-3 shrink-0 border-t border-gray-800/30">
        {/* 재생 바 */}
        <div className="relative w-full h-1.5 bg-gray-700 rounded-full group cursor-pointer" onClick={handleSeek}>
          <div className="absolute top-0 left-0 h-full bg-brand-purple rounded-full shadow-[0_0_12px_#7C3AED]" style={{ width: `${(played * 100).toFixed(2)}%` }} />
        </div>

        <div className="flex items-center justify-between text-gray-400">
          <div className="flex items-center gap-5">
            <button onClick={() => setPlaying(!playing)} className="text-white hover:text-brand-purple transition-colors">
              {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
            </button>
            <button onClick={() => playerRef.current.seekTo(0)} className="hover:text-white transition-colors"><RotateCcw size={20} /></button>

            {/* 볼륨 컨트롤 영역 */}
            <div className="flex items-center gap-3 ml-2 group/volume">
              <button onClick={() => setMuted(!muted)} className="hover:text-white transition-colors">
                {getVolumeIcon()}
              </button>
              
              {/* 볼륨 슬라이더: 평소엔 작게, 호버 시 명확하게 표시 */}
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
                className="w-16 h-1 bg-gray-700 rounded-full appearance-none cursor-pointer accent-brand-purple hover:w-20 transition-all"
              />
              
              <span className="text-[11px] font-mono tracking-tighter">
                {formatTime(playedSeconds)} <span className="mx-1 text-gray-600">/</span> {formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 bg-gray-800 rounded hover:text-white transition-colors">
              <Clock3 size={14} /> 1.0x
            </button>
            <button className="hover:text-white transition-colors"><Maximize size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Player;
