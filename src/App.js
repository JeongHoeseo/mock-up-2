import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Video, Folder, User, Download, 
  Sparkles, Moon, Sun, Search, X
} from 'lucide-react';
import Upload from './components/Upload';
import Status from './components/Status';
import Player from './components/Player';
import Editor from './components/Editor';
import useProcessing from './hooks/useProcessing';

function App() {
  const [videoId, setVideoId] = useState(null);
  const [localSegments, setLocalSegments] = useState([]);
  const [isDark, setIsDark] = useState(true); 
  const [subtitleStyle, setSubtitleStyle] = useState('formal');
  const [searchTerm, setSearchTerm] = useState("");
  
  const [duration, setDuration] = useState(0); 
  const [played, setPlayed] = useState(0); 
  const playerRef = useRef(null);

  const { data } = useProcessing(videoId, subtitleStyle);

  useEffect(() => {
    if (data?.segments) {
      setLocalSegments(data.segments);
    }
  }, [data]);

  const filteredSegments = useMemo(() => {
    return localSegments.filter(seg => 
      seg.corrected.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [localSegments, searchTerm]);

  // 단축키 시스템 (Space: 재생/정지, 방향키: 10초 이동)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (!playerRef.current) return;

      const player = playerRef.current;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          // Player 내부의 playing 상태를 직접 제어하기 위해 
          // 버튼 클릭 이벤트를 시뮬레이션하거나 상태를 App으로 끌어올릴 수 있습니다.
          break;
        case 'ArrowLeft':
          e.preventDefault();
          player.seekTo(Math.max(player.getCurrentTime() - 10, 0));
          break;
        case 'ArrowRight':
          e.preventDefault();
          player.seekTo(Math.min(player.getCurrentTime() + 10, duration));
          break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration]);

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00:00";
    const date = new Date(seconds * 1000);
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  const exportSubtitles = () => {
    const content = JSON.stringify(localSegments, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'subtitles.json'; link.click();
  };

  const theme = {
    bg: isDark ? "bg-[#0F111A]" : "bg-[#F3F4F6]",
    sidebar: isDark ? "bg-[#161927] border-gray-800/50" : "bg-white border-gray-200 shadow-sm",
    header: isDark ? "bg-[#161927]/60 border-gray-800/50" : "bg-white/80 border-gray-200",
    text: isDark ? "text-white" : "text-gray-900",
    subText: isDark ? "text-gray-500" : "text-gray-400",
    waveform: isDark ? "bg-[#161927] border-gray-800/50" : "bg-white border-gray-200 shadow-sm",
    searchBar: isDark ? "bg-[#1C2030] border-gray-800/50" : "bg-white border-gray-300"
  };

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-500 ${theme.bg} ${theme.text}`}>
      <aside className={`w-20 flex flex-col items-center py-8 border-r transition-all duration-500 ${theme.sidebar} z-20`}>
        <div className="w-12 h-12 bg-brand-purple rounded-2xl flex items-center justify-center shadow-lg mb-10 shrink-0">
          <Video size={28} className="text-white" />
        </div>
        <div className="flex flex-col items-center gap-10">
          <button className="p-2 rounded-xl hover:bg-brand-purple/10 transition-colors">
            <Folder size={26} className="text-brand-purple" />
          </button>
          <button onClick={() => setIsDark(!isDark)} className="group relative flex items-center justify-center p-2 rounded-xl hover:bg-brand-purple/10 transition-all duration-300">
            {isDark ? <Sun size={26} className="text-gray-600 group-hover:text-amber-400" /> : <Moon size={26} className="text-gray-400 group-hover:text-brand-purple" />}
          </button>
        </div>
        <div className="mt-auto relative p-2">
          <User size={26} className="text-gray-600" />
          <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-current" />
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className={`h-20 border-b backdrop-blur-xl flex items-center justify-between px-10 z-10 transition-all duration-500 ${theme.header}`}>
          <div className="flex items-center gap-5">
            <h1 className={`text-2xl font-black tracking-tighter uppercase italic tracking-widest ${theme.text}`}>AI Subtitle Pro</h1>
            {videoId && (
              <div className="flex items-center gap-2 bg-brand-purple/10 px-4 py-1.5 rounded-full border border-brand-purple/20 text-brand-purple-light text-[11px] font-bold uppercase">
                <Sparkles size={14} /> {subtitleStyle} Mode
              </div>
            )}
          </div>
          <button onClick={exportSubtitles} className="bg-brand-purple hover:bg-brand-purple-light text-white px-7 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-purple/20 transition-all text-sm">
            <Download size={20} /> 내보내기
          </button>
        </header>

        <main className="flex-1 flex overflow-hidden min-h-0">
          {!videoId ? (
            <div className="flex-1 flex items-center justify-center relative bg-brand-bg">
              <Upload onUploadSuccess={(url, style) => { setVideoId(url); setSubtitleStyle(style); }} isDark={isDark} />
            </div>
          ) : data?.status === 'PROCESSING' ? (
            <div className="flex-1 flex items-center justify-center"><Status progress={data.progress} isDark={isDark} /></div>
          ) : (
            <>
              <section className="flex-1 flex flex-col p-8 gap-8 min-w-0 h-full">
                <div className="flex-1 min-h-0 shadow-2xl">
                  <Player 
                    url={videoId} 
                    isDark={isDark} 
                    onDuration={setDuration} 
                    onProgress={setPlayed}
                    playerRef={playerRef}
                  />
                </div>
                
                <div className={`h-32 rounded-3xl p-6 border shadow-inner relative overflow-hidden transition-all duration-500 ${theme.waveform}`}>
                   <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-brand-purple rounded-full shadow-[0_0_8px_#7C3AED]" />
                       <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${theme.subText}`}>자막 분포 타임라인</span>
                     </div>
                     <span className="text-[9px] font-mono text-gray-500 uppercase">Total: {localSegments.length} Segments</span>
                   </div>
                   
                   <div className="relative h-6 w-full bg-gray-500/10 rounded-lg flex items-center overflow-hidden border border-gray-800/20">
                     {duration > 0 && localSegments.map((seg, idx) => {
                       const left = (seg.start / duration) * 100;
                       const width = Math.max(((seg.end - seg.start) / duration) * 100, 0.5);
                       return (
                         <div 
                           key={seg.id || idx}
                           className="absolute h-full bg-brand-purple/40 border-x border-brand-purple/20 hover:bg-brand-purple transition-all cursor-pointer group"
                           style={{ left: `${left}%`, width: `${width}%` }}
                           onClick={() => playerRef.current?.seekTo(seg.start)}
                         >
                           <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 border border-white/10">
                             {seg.corrected.substring(0, 20)}...
                           </div>
                         </div>
                       );
                     })}
                     <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_white] z-20 pointer-events-none transition-all duration-100" style={{ left: `${(played * 100).toFixed(2)}%` }} />
                   </div>
                   
                   <div className="mt-3 flex justify-between text-[9px] text-gray-500 font-mono uppercase tracking-tighter">
                     <span>00:00:00 START</span>
                     <span>{formatTime(duration)} END</span>
                   </div>
                </div>
              </section>

              <aside className={`w-[480px] border-l shadow-2xl z-10 transition-all duration-500 ${theme.sidebar} flex flex-col`}>
                <div className="p-4 border-b border-gray-800/30">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${theme.searchBar}`}>
                    <Search size={16} className="text-gray-500" />
                    <input type="text" placeholder="자막 내용 검색..." className="bg-transparent border-none outline-none text-sm w-full text-current" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    {searchTerm && <X size={16} className="text-gray-500 cursor-pointer" onClick={() => setSearchTerm("")} />}
                  </div>
                </div>
                <Editor segments={filteredSegments} isDark={isDark} onUpdate={(id, txt) => { setLocalSegments(prev => prev.map(s => s.id === id ? {...s, corrected: txt} : s)); }} />
              </aside>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
