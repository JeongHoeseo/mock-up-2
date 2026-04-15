import React, { useState, useEffect, useMemo } from 'react';
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
  const [searchTerm, setSearchTerm] = useState(""); // 검색 기능 추가

  // --- 데이터 로드 ---
  const { data } = useProcessing(videoId, subtitleStyle);

  useEffect(() => {
    if (data?.segments) {
      setLocalSegments(data.segments);
    }
  }, [data]);

  // --- [프론트 전용 기능 1] 자막 검색 필터링 ---
  const filteredSegments = useMemo(() => {
    return localSegments.filter(seg => 
      seg.corrected.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [localSegments, searchTerm]);

  // --- [프론트 전용 기능 2] 단축키 시스템 ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Input이나 Textarea 입력 중에는 단축키 무시
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        // Player의 재생 상태를 제어하는 로직을 여기에 연결 가능
        console.log("Space pressed: Play/Pause Toggle");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- [프론트 전용 기능 3] 파일 내보내기 (다운로드) ---
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
                <div className="flex-1 min-h-0 shadow-2xl"><Player url={videoId} isDark={isDark} /></div>
                
                {/* 하단 오디오 트랙 영역 */}
                <div className={`h-32 rounded-3xl p-6 border shadow-inner relative overflow-hidden transition-all duration-500 ${theme.waveform}`}>
                   <div className="h-10 w-full flex items-center gap-1 opacity-20 mt-6">
                     {[...Array(80)].map((_, i) => (
                       <div key={i} className={`flex-1 rounded-full ${isDark ? 'bg-gray-500' : 'bg-gray-400'}`} style={{ height: `${10 + Math.random() * 90}%` }} />
                     ))}
                   </div>
                   <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-brand-purple shadow-[0_0_15px_#7C3AED]" />
                </div>
              </section>

              {/* 오른쪽: 자막 에디터 (검색 기능 추가) */}
              <aside className={`w-[480px] border-l shadow-2xl z-10 transition-all duration-500 ${theme.sidebar} flex flex-col`}>
                {/* 검색 바 영역 */}
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
                  segments={filteredSegments} // 검색된 결과만 전달
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
