import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Video, Folder, User, Download, 
  Sparkles, Moon, Sun, Search, X, FileVideo, Check, ChevronRight
} from 'lucide-react';
import Player from './components/Player';
import Editor from './components/Editor';
import useProcessing from './hooks/useProcessing';
import Status from './components/Status';

function App() {
  const [videoId, setVideoId] = useState(null);
  const [localSegments, setLocalSegments] = useState([]);
  const [isDark, setIsDark] = useState(true); 
  const [playing, setPlaying] = useState(false);
  const [subtitleStyle, setSubtitleStyle] = useState('formal');
  const [searchTerm, setSearchTerm] = useState("");
  
  const [duration, setDuration] = useState(0); 
  const [played, setPlayed] = useState(0); 
  const playerRef = useRef(null);

  const { data } = useProcessing(videoId, subtitleStyle);

  useEffect(() => {
    if (data?.segments) setLocalSegments(data.segments);
  }, [data]);

  const filteredSegments = useMemo(() => {
    return localSegments.filter(seg => 
      seg.corrected.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [localSegments, searchTerm]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (!playerRef.current) return;

      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        playerRef.current?.seekTo(Math.max(playerRef.current.getCurrentTime() - 10, 0));
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        playerRef.current?.seekTo(Math.min(playerRef.current.getCurrentTime() + 10, duration));
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

  const theme = {
    bg: isDark ? "bg-[#0A0C14]" : "bg-[#F3F4F6]",
    sidebar: isDark ? "bg-[#11131F] border-gray-800/50" : "bg-white border-gray-200 shadow-sm",
    header: isDark ? "bg-[#11131F]/60 border-gray-800/50" : "bg-white/80 border-gray-200",
    text: isDark ? "text-white" : "text-gray-900",
    subText: isDark ? "text-gray-500" : "text-gray-400",
    card: isDark ? "bg-[#11131F] border-gray-800/50" : "bg-white border-gray-200 shadow-xl",
    uploadZone: isDark ? "bg-[#0A0C14] border-gray-700/50" : "bg-gray-50 border-gray-300",
    searchBar: isDark ? "bg-[#1C2030] border-gray-800/50" : "bg-white border-gray-300"
  };

  // --- [수정] 옵션 2: 영문 서브 텍스트로 깔끔하게 변경 ---
  const styleOptions = [
    { id: 'formal', name: '문어체', desc: 'FORMAL STYLE' },
    { id: 'casual', name: '구어체', desc: 'CASUAL STYLE' },
  ];

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-500 ${theme.bg} ${theme.text}`}>
      
      {/* 1. 사이드바 */}
      <aside className={`w-24 flex flex-col items-center py-10 border-r transition-all duration-500 ${theme.sidebar} z-20`}>
        <div className="w-14 h-14 bg-brand-purple rounded-3xl flex items-center justify-center shadow-lg shadow-brand-purple/20 mb-12 shrink-0">
          <Video size={32} className="text-white" fill="currentColor" />
        </div>
        <div className="flex flex-col items-center gap-12 relative w-full">
          <div className="absolute left-0 w-1 h-12 bg-brand-purple rounded-r-full" style={{ top: '0px' }} />
          <button className="p-3 rounded-2xl bg-brand-purple/10 transition-colors">
            <Folder size={30} className="text-brand-purple" fill="currentColor" />
          </button>
          <button onClick={() => setIsDark(!isDark)} className="group relative flex items-center justify-center p-3 rounded-2xl hover:bg-brand-purple/5 transition-all">
            {isDark ? <Sun size={30} className="text-gray-600 hover:text-amber-400" fill="currentColor" /> : <Moon size={30} className="text-gray-400 hover:text-brand-purple" fill="currentColor" />}
          </button>
        </div>
        <div className="mt-auto p-3"><User size={30} className="text-gray-600" fill="currentColor" /></div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* 2. 헤더 */}
        <header className={`h-24 border-b backdrop-blur-xl flex items-center justify-between px-12 z-10 transition-all duration-500 ${theme.header}`}>
          <h1 className={`text-3xl font-black tracking-tighter italic ${theme.text}`}>AI SUBTITLE PRO</h1>
          <button 
            disabled={!videoId}
            className={`px-8 py-4 rounded-2xl font-bold flex items-center gap-2.5 transition-all text-sm shadow-lg ${
              videoId 
                ? 'bg-brand-purple hover:bg-brand-purple-light text-white shadow-brand-purple/20' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            <Download size={22} /> 내보내기
          </button>
        </header>

        <main className="flex-1 flex overflow-hidden min-h-0">
          {!videoId ? (
            <div className="flex-1 flex items-center justify-center p-12 bg-[#080A11]">
              <div className={`w-full max-w-5xl p-12 rounded-[40px] border shadow-2xl ${theme.card}`}>
                <h2 className="text-[28px] font-extrabold tracking-tighter mb-10 flex items-center gap-3">
                  <Sparkles className="text-brand-purple" size={26} />
                  새로운 AI 자막 프로젝트 시작하기
                </h2>

                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-7 h-7 bg-brand-purple rounded-full flex items-center justify-center text-xs font-bold text-white">1</span>
                    <h3 className="text-lg font-bold">영상 업로드</h3>
                  </div>
                  <div className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all hover:border-brand-purple group ${theme.uploadZone}`}>
                    <input type="file" id="video-upload" className="hidden" accept="video/*" onChange={(e) => {
                      if (e.target.files[0]) setVideoId(URL.createObjectURL(e.target.files[0]));
                    }} />
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <FileVideo size={56} className="text-gray-600 group-hover:text-brand-purple mx-auto mb-6" />
                      <p className="text-base font-medium text-gray-300 mb-1.5 group-hover:text-white">클릭하거나 드래그하여 업로드하세요.</p>
                      <p className={`text-[13px] ${theme.subText}`}>MP4, MOV, AVI... (최대 2GB)</p>
                    </label>
                  </div>
                </div>

                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-7 h-7 bg-brand-purple rounded-full flex items-center justify-center text-xs font-bold text-white">2</span>
                    <h3 className="text-lg font-bold">자막 스타일 선택</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    {styleOptions.map(option => (
                      <button 
                        key={option.id} 
                        onClick={() => setSubtitleStyle(option.id)}
                        className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
                          subtitleStyle === option.id 
                            ? 'bg-brand-purple border-brand-purple text-white' 
                            : `${theme.uploadZone} border-transparent hover:border-gray-600`
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${subtitleStyle === option.id ? 'bg-white border-white' : 'border-gray-600'}`}>
                          {subtitleStyle === option.id && <Check size={16} className="text-brand-purple" />}
                        </div>
                        <div>
                          <p className="font-bold text-base tracking-tight">{option.name}</p>
                          <p className={`text-[10px] font-black tracking-widest mt-0.5 opacity-60 uppercase`}>{option.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => { if (videoId) setPlaying(true); }}
                  className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all text-base shadow-lg ${
                    videoId 
                      ? 'bg-brand-purple hover:bg-brand-purple-light text-white shadow-brand-purple/20' 
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  AI 자막 생성 시작하기 <ChevronRight size={22} />
                </button>
              </div>
            </div>
          ) : data?.status === 'PROCESSING' ? (
            <div className="flex-1 flex items-center justify-center"><Status progress={data.progress} isDark={isDark} /></div>
          ) : (
            <>
              <section className="flex-1 flex flex-col p-8 gap-8 min-w-0 h-full">
                <div className="flex-1 min-h-0 shadow-2xl">
                  <Player 
                    url={videoId} isDark={isDark} playing={playing} setPlaying={setPlaying}
                    onDuration={setDuration} onProgress={setPlayed} playerRef={playerRef}
                  />
                </div>
                <div className={`h-32 rounded-3xl p-6 border shadow-inner relative overflow-hidden transition-all duration-500 ${theme.waveform}`}>
                   {/* ... 히트맵 로직 동일 ... */}
                   <div className="flex justify-between items-center mb-4 text-[10px] font-bold uppercase tracking-widest">
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 bg-brand-purple rounded-full shadow-[0_0_8px_#7C3AED]" />
                       <span className={theme.subText}>자막 분포 타임라인</span>
                     </div>
                     <span className="text-gray-500 font-mono">Total: {localSegments.length} Segments</span>
                   </div>
                   <div className="relative h-6 w-full bg-gray-500/10 rounded-lg flex items-center overflow-hidden border border-gray-800/20">
                     {duration > 0 && localSegments.map((seg, idx) => (
                       <div key={idx} className="absolute h-full bg-brand-purple/40 border-x border-brand-purple/20 hover:bg-brand-purple transition-all cursor-pointer group"
                         style={{ left: `${(seg.start / duration) * 100}%`, width: `${Math.max(((seg.end - seg.start) / duration) * 100, 0.5)}%` }}
                         onClick={() => playerRef.current?.seekTo(seg.start)}
                       >
                         <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">{seg.corrected.substring(0, 15)}...</div>
                       </div>
                     ))}
                     <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_white] z-20 pointer-events-none transition-all duration-100" style={{ left: `${(played * 100).toFixed(2)}%` }} />
                   </div>
                   <div className="mt-3 flex justify-between text-[9px] text-gray-500 font-mono tracking-tighter uppercase">
                     <span>00:00:00 START</span><span>{formatTime(duration)} END</span>
                   </div>
                </div>
              </section>
              <aside className={`w-[480px] border-l shadow-2xl z-10 transition-all duration-500 ${theme.sidebar} flex flex-col`}>
                <div className="p-4 border-b border-gray-800/30">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${theme.searchBar}`}>
                    <Search size={16} className="text-gray-500" /><input type="text" placeholder="자막 내용 검색..." className="bg-transparent border-none outline-none text-sm w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
