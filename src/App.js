import React, { useState, useEffect, useMemo, useRef } from 'react'; // useRef 추가
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
  // --- 상태 관리 ---
  const [videoId, setVideoId] = useState(null);
  const [localSegments, setLocalSegments] = useState([]);
  const [isDark, setIsDark] = useState(true); 
  const [subtitleStyle, setSubtitleStyle] = useState('formal');
  const [searchTerm, setSearchTerm] = useState("");
  
  // 히트맵 연동을 위한 추가 상태
  const [duration, setDuration] = useState(0); 
  const [played, setPlayed] = useState(0); 
  const playerRef = useRef(null); // Player 제어를 위한 Ref

  // --- 데이터 로드 ---
  const { data } = useProcessing(videoId, subtitleStyle);

  useEffect(() => {
    if (data?.segments) {
      setLocalSegments(data.segments);
    }
  }, [data]);

  // --- 자막 검색 필터링 ---
  const filteredSegments = useMemo(() => {
    return localSegments.filter(seg => 
      seg.corrected.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [localSegments, searchTerm]);

  // --- 시간 포맷 함수 (히트맵 가이드용) ---
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00";
    const mm = Math.floor(seconds / 60);
    const ss = String(Math.floor(seconds % 60)).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  // --- 파일 내보내기 ---
  const exportSubtitles = () => {
    const content = JSON.stringify(localSegments, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'subtitles.json';
    link.click();
  };

  const theme = {
    bg: isDark ? "bg-[#0F111A]" : "bg-[#F3F4F6]",
    sidebar: isDark ? "bg-[#161927] border-gray-800/50" : "bg-white border-gray-200 shadow-sm",
    header: isDark ? "bg-[#161927]/60 border-gray-800/50" : "bg-white/80 border-gray-200",
    text: isDark ? "text-white" : "text-gray-900",
    subText: isDark ? "text-gray-500" : "text-gray-400",
    waveform: isDark ? "bg-[#161927] border-gray-800/50" : "bg-white border-gray-200",
    searchBar: isDark ? "bg-[#1C2030] border-gray-800/50" : "bg-white border-gray-300"
  };

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-500 ${theme.bg} ${theme.text}`}>
      
      {/* 1. 사이드바 */}
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
        
        {/* 2. 헤더 */}
        <header className={`h-20 border-b backdrop-blur-xl flex items-center justify-between px-10 z-10 transition-all duration-500 ${theme.header}`}>
          <div className="flex items-center gap-5">
            <h1 className={`text-2xl font-black tracking-tighter uppercase italic tracking-widest ${theme.text}`}>AI Subtitle Pro</h1>
            {videoId && (
              <div className="flex items-center gap-2 bg-brand-purple/10 px-4 py-1.5 rounded-full border border-brand-purple/20 text-brand-purple-light text-[11px] font-bold uppercase">
                <Sparkles size={14} /> {subtitleStyle} Mode
              </div>
            )}
          </div>
          <button 
            onClick={exportSubtitles}
            className="bg-brand-purple hover:bg-brand-purple-light text-white px-7 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-purple/20 transition-all text-sm"
          >
            <Download size={20} /> 내보내기
          </button>
        </header>

        {/* 3. 메인 작업대 */}
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
                {/* 비디오 플레이어 (Ref 및 상태 감지 추가) */}
                <div className="flex-1 min-h-0 shadow-2xl">
                  <Player 
                    url={videoId} 
                    isDark={isDark} 
                    onDuration={setDuration} 
                    onProgress={(p) => setPlayed(p)}
                    playerRef={playerRef}
                  />
                </div>
                
                {/* [교체 완료] 자막 히트맵 타임라인 영역 */}
                <div className={`h-32 rounded-3xl p-6 border shadow-inner relative overflow-hidden transition-all duration-500 ${theme.waveform}`}>
                   <div className="flex justify-between items-center mb-4">
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-brand-purple rounded-full shadow-[0_0_8px_#7C3AED]" />
                       <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${theme.subText}`}>자막 분포 타임라인</span>
                     </div>
                     <span className="text-[9px] font-mono text-gray-500 uppercase">Total: {localSegments.length} Segments</span>
                   </div>
                   
                   {/* 히트맵 바 */}
                   <div className="relative h-6 w-full bg-gray-500/10 rounded-lg flex items-center overflow-hidden border border-gray-800/20">
                     {duration > 0 && localSegments.map((seg, idx) => {
                       const left = (seg.start / duration) * 100;
                       const width = Math.max(((seg.end - seg.start) / duration) * 100, 0.5);
                       return (
                         <div 
                           key={seg.id || idx}
                           className="absolute h-full bg-brand-purple/40 border-x border-brand-purple/20 hover:bg-brand-purple/80 transition-all cursor-pointer group"
                           style={{ left: `${left}%`, width: `${width}%` }}
                           onClick={() => playerRef.current?.seekTo(seg.start)}
                         >
                           {/* 툴팁 */}
                           <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 border border-white/10">
                             {seg.corrected.substring(0, 20)}...
                           </div>
                         </div>
                       );
                     })}

                     {/* 현재 재생 위치 실시간 가이드선 */}
                     <div 
                       className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_white] z-20 pointer-events-none transition-all duration-100"
                       style={{ left: `${(played * 100).toFixed(2)}%` }}
                     />
                   </div>
                   
                   <div className="mt-3 flex justify-between text-[9px] text-gray-500 font-mono uppercase tracking-tighter">
                     <span>00:00 START</span>
                     <span>{formatTime(duration)} END</span>
                   </div>
                </div>
              </section>

              {/* 오른쪽: 자막 에디터 */}
              <aside className={`w-[480px] border-l shadow-2xl z-10 transition-all duration-500 ${theme.sidebar} flex flex-col`}>
                <div className="p-4 border-b border-gray-800/30">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${theme.searchBar}`}>
                    <Search size={16} className="text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="자막 내용 검색..." 
                      className="bg-transparent border-none outline-none text-sm w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && <X size={16} className="text-gray-500 cursor-pointer" onClick={() => setSearchTerm("")} />}
                  </div>
                </div>

                <Editor 
                  segments={filteredSegments}
                  isDark={isDark} 
                  onUpdate={(id, txt) => {
                    setLocalSegments(prev => prev.map(s => s.id === id ? {...s, corrected: txt} : s));
                  }} 
                />
              </aside>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
