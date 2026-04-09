import React, { useState, useEffect } from 'react';
import { 
  Video, Folder, User, Download, 
  Sparkles, Moon, Sun, Play, Pause, 
  RotateCcw, Volume2, VolumeX, Maximize, 
  Clock3
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

  const { data } = useProcessing(videoId, subtitleStyle);

  useEffect(() => {
    if (data?.segments) {
      setLocalSegments(data.segments);
    }
  }, [data]);

  const handleUpdate = (id, newText) => {
    setLocalSegments(prev => 
      prev.map(seg => seg.id === id ? { ...seg, corrected: newText } : seg)
    );
  };

  const theme = {
    bg: isDark ? "bg-[#0F111A]" : "bg-[#F3F4F6]",
    sidebar: isDark ? "bg-[#161927] border-gray-800/50" : "bg-white border-gray-200 shadow-sm",
    header: isDark ? "bg-[#161927]/60 border-gray-800/50" : "bg-white/80 border-gray-200",
    text: isDark ? "text-white" : "text-gray-900",
    waveform: isDark ? "bg-[#161927] border-gray-800/50" : "bg-white border-gray-200"
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
        
        {/* 2. 헤더: 버튼 한글화 확인 */}
        <header className={`h-20 border-b backdrop-blur-xl flex items-center justify-between px-10 z-10 transition-all duration-500 ${theme.header}`}>
          <div className="flex items-center gap-5">
            <h1 className={`text-2xl font-black tracking-tighter uppercase italic tracking-widest ${theme.text}`}>AI Subtitle Pro</h1>
            {videoId && (
              <div className="flex items-center gap-2 bg-brand-purple/10 px-4 py-1.5 rounded-full border border-brand-purple/20 text-brand-purple-light text-[11px] font-bold uppercase">
                <Sparkles size={14} /> {subtitleStyle} Mode
              </div>
            )}
          </div>
          {/* 상단 버튼 한글화 완료 */}
          <button className="bg-brand-purple hover:bg-brand-purple-light text-white px-7 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-purple/20 transition-all text-sm">
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
                <div className={`h-32 rounded-3xl p-6 border shadow-inner relative overflow-hidden transition-all duration-500 ${theme.waveform}`}>
                   <div className="h-10 w-full flex items-center gap-1 opacity-20 mt-6">
                     {[...Array(80)].map((_, i) => (
                       <div key={i} className={`flex-1 rounded-full ${isDark ? 'bg-gray-500' : 'bg-gray-400'}`} style={{ height: `${10 + Math.random() * 90}%` }} />
                     ))}
                   </div>
                   <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-brand-purple shadow-[0_0_15px_#7C3AED]" />
                </div>
              </section>
              <aside className={`w-[480px] border-l shadow-2xl z-10 transition-all duration-500 ${theme.sidebar}`}>
                <Editor segments={localSegments} isDark={isDark} onUpdate={handleUpdate} />
              </aside>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;