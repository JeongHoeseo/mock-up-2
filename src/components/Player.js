import React, { useRef, useState } from 'react';
import ReactPlayer from 'react-player';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, Clock3 } from 'lucide-react';

function Player({ url }) {
  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);      // 진행 비율 (0 ~ 1)
  const [playedSeconds, setPlayedSeconds] = useState(0); // 실제 재생 시간(초)
  const [duration, setDuration] = useState(0);  // 실제 총 길이(초)
  const [muted, setMuted] = useState(false);

  // 시간 포맷 변환 (27:52 처럼 표시)
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00";
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    if (hh > 0) {
      return `${hh}:${String(mm).padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  // 영상의 실제 총 길이를 감지했을 때 실행
  const handleDuration = (d) => {
    console.log('Detected duration:', d);
    setDuration(d);
  };

  // 재생바 클릭 시 이동 (Seek)
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
          // 영상 진행 상황 감지
          onProgress={(s) => {
            setPlayed(s.played);
            setPlayedSeconds(s.playedSeconds);
          }}
          // 핵심: 영상 총 길이를 여기서 받아옴
          onDuration={handleDuration}
          style={{ position: 'absolute', top: 0, left: 0 }}
          config={{ file: { attributes: { style: { objectFit: 'contain' } } } }}
        />
      </div>

      <div className="bg-[#1C1F2E] px-6 py-4 flex flex-col gap-3 shrink-0">
        {/* 프로그레스 바: played 비율에 따라 정확히 이동 */}
        <div className="relative w-full h-1.5 bg-gray-700 rounded-full group cursor-pointer" onClick={handleSeek}>
          <div 
            className="absolute top-0 left-0 h-full bg-brand-purple rounded-full shadow-[0_0_12px_#7C3AED]" 
            style={{ width: `${(played * 100).toFixed(2)}%` }} 
          />
        </div>

        <div className="flex items-center justify-between text-gray-400">
          <div className="flex items-center gap-5">
            <button onClick={() => setPlaying(!playing)} className="text-white">
              {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
            </button>
            <button onClick={() => playerRef.current.seekTo(0)} className="hover:text-white"><RotateCcw size={20} /></button>
            
            <div className="flex items-center gap-3 ml-2">
              <button onClick={() => setMuted(!muted)}>{muted ? <VolumeX size={20} className="text-red-500" /> : <Volume2 size={20} />}</button>
              {/* 버그 수정: 실제 진행 시간 / 실제 총 길이 표기 */}
              <span className="text-[11px] font-mono text-gray-500">
                {formatTime(playedSeconds)} / {formatTime(duration)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <button className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 bg-gray-800 rounded hover:text-white transition-colors">
              <Clock3 size={14} /> 1.0x
            </button>
            <button className="hover:text-white"><Maximize size={20} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Player;
