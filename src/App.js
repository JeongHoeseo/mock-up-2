import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { 
  Video, Folder, User, Download, Sparkles, Moon, Sun, Search, X, FileVideo, Check, ChevronRight 
} from 'lucide-react';
import Player from './components/Player';
import Editor from './components/Editor';
import Status from './components/Status';
import useProcessing from './hooks/useProcessing';

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [serverFileId, setServerFileId] = useState(null);
  const [localSegments, setLocalSegments] = useState([]);
  const [isDark, setIsDark] = useState(true); 
  const [playing, setPlaying] = useState(false);
  
  // UI에서는 'formal'과 'casual'만 관리합니다.
  const [subtitleType, setSubtitleType] = useState('formal');
  const [searchTerm, setSearchTerm] = useState("");
  
  const [duration, setDuration] = useState(0); 
  const [played, setPlayed] = useState(0); 
  const playerRef = useRef(null);

  // [핵심 매핑] 선택된 타입에 따라 백엔드가 인식하는 LoRA 도메인으로 변환
  const internalDomain = subtitleType === 'formal' ? 'politics' : 'ent';
  
  // useProcessing에 매핑된 도메인 전달
  const { data } = useProcessing(serverFileId, internalDomain);

  useEffect(() => {
    if (data?.segments) setLocalSegments(data.segments);
  }, [data]);

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        setVideoId(URL.createObjectURL(file));
      }
    }
  };

  const handleStartAI = async () => {
    if (!videoFile) return;

    // [절대 보존] 기존 환경 변수 로직
    const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!rawBaseUrl || rawBaseUrl === "undefined") {
      alert("Vercel 환경 변수가 설정되지 않았습니다.");
      return;
    }
    const baseUrl = rawBaseUrl.replace(/\/$/, "");

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      // 내부 매핑된 도메인(politics 또는 ent)을 전송
      formData.append('domain', internalDomain);

      const uploadRes = await axios.post(`${baseUrl}/upload/process`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setServerFileId(uploadRes.data.file_id);
    } catch (err) {
      console.error("서버 전송 실패:", err);
      alert("영상 업로드 중 오류가 발생했습니다.");
    }
  };

  // [보존] 기존 가시성 테마 설정
  const theme = {
    bg: isDark ? "bg-[#0A0C14]" : "bg-[#F8FAFC]",
    sidebar: isDark ? "bg-[#11131F] border-gray-800/50" : "bg-white border-gray-200 shadow-sm",
    header: isDark ? "bg-[#11131F]/60 border-gray-800/50" : "bg-white/80 border-gray-200 shadow-sm",
    text: isDark ? "text-white" : "text-[#1E293B]",
    card: isDark ? "bg-[#11131F] border-gray-800/50" : "bg-white border-transparent shadow-xl",
    uploadZone: isDark ? "bg-[#0A0C14] border-gray-700/50" : "bg-[#F1F5F9] border-slate-200",
    searchBar: isDark ? "bg-[#1C2030] border-gray-800/50" : "bg-slate-100 border-slate-200"
  };

  // 화면에 보여줄 옵션 (요구사항대로 문어체/구어체 구성)
  const typeOptions = [
    { id: 'formal', name: '문어체', desc: '정치 / 사회 / 뉴스 스타일' },
    { id: 'casual', name: '구어체', desc: '연예 / 여행 / 휴가 스타일' },
  ];

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-500 ${theme.bg} ${theme.text}`}>
      <aside className={`w-24 flex flex-col items-center py-10 border-r transition-all duration-500 ${theme.sidebar} z-20`}>
        <div className="w-14 h-14 bg-brand-purple rounded-3xl flex items-center justify-center shadow-lg mb-12 shrink-0">
          <Video size={32} className="text-white" fill="currentColor" />
        </div>
        <div className="flex flex-col items-center gap-12 relative w-full">
          <button className={`p-3 rounded-2xl transition-colors ${isDark ? 'bg-brand-purple/10' : 'bg-slate-100'}`}>
            <Folder size={30} className="text-brand-purple" fill="currentColor" />
          </button>
          <button onClick={() => setIsDark(!isDark)} className="p-3 rounded-2xl hover:bg-slate-200 transition-all">
            {isDark ? <Sun size={30} className="text-gray-600" fill="currentColor" /> : <Moon size={30} className="text-slate-400" fill="currentColor" />}
          </button>
        </div>
        <div className="mt-auto p-3"><User size={30} className="text-slate-300" fill="currentColor" /></div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className={`h-24 border-b backdrop-blur-xl flex items-center justify-between px-12 z-10 transition-all duration-500 ${theme.header}`}>
          <h1 className={`text-3xl font-black tracking-tighter italic ${theme.text}`}>AI SUBTITLE PRO</h1>
          <button 
            disabled={!serverFileId}
            className={`px-8 py-4 rounded-2xl font-bold flex items-center gap-2.5 transition-all text-sm shadow-lg ${
              serverFileId ? 'bg-brand-purple hover:bg-brand-purple-light text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Download size={22} /> 내보내기
          </button>
        </header>

        <main className="flex-1 flex overflow-hidden min-h-0">
          {!serverFileId && data?.status === 'IDLE' ? (
            <div className="flex-1 flex items-center justify-center p-12 overflow-y-auto">
              <div className={`w-full max-w-5xl p-14 rounded-[48px] border transition-all duration-500 ${theme.card}`}>
                <h2 className="text-[32px] font-extrabold mb-12 flex items-center gap-4">
                  <Sparkles className="text-brand-purple" size={32} /> 새로운 AI 자막 프로젝트
                </h2>

                <div className="mb-12">
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-[32px] p-12 text-center cursor-pointer transition-all hover:border-brand-purple group ${theme.uploadZone}`}
                  >
                    <input type="file" id="video-upload" className="hidden" accept="video/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) { setVideoFile(file); setVideoId(URL.createObjectURL(file)); }
                    }} />
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <FileVideo size={64} className={`${isDark ? 'text-gray-700' : 'text-slate-300'} group-hover:text-brand-purple mx-auto mb-6`} />
                      <p className="text-lg font-bold mb-2">{videoFile ? videoFile.name : "클릭하거나 드래그하여 업로드하세요."}</p>
                    </label>
                  </div>
                </div>

                <div className="mb-14">
                  <h3 className="text-xl font-bold mb-6">자막 말투 선택</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {typeOptions.map(option => (
                      <button 
                        key={option.id} 
                        onClick={() => setSubtitleType(option.id)}
                        className={`p-7 rounded-[28px] border-2 transition-all flex items-center gap-5 text-left ${
                          subtitleType === option.id 
                            ? 'bg-brand-purple border-brand-purple text-white shadow-xl shadow-brand-purple/20' 
                            : isDark 
                              ? 'bg-[#08090F] border-gray-800/40' 
                              : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                          subtitleType === option.id ? 'bg-white border-white' : isDark ? 'border-gray-700' : 'border-slate-300'
                        }`}>
                          {subtitleType === option.id && <Check size={18} className="text-brand-purple" strokeWidth={3} />}
                        </div>
                        <div>
                          <p className={`font-bold text-lg transition-colors ${
                            subtitleType === option.id ? 'text-white' : isDark ? 'text-gray-400' : 'text-slate-600'
                          }`}>
                            {option.name}
                          </p>
                          <p className={`text-[11px] font-black tracking-widest mt-1 uppercase transition-colors ${
                            subtitleType === option.id ? 'text-white/70' : isDark ? 'text-gray-600' : 'text-slate-400'
                          }`}>
                            {option.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={handleStartAI}
                  className={`w-full py-6 rounded-[28px] font-black text-lg shadow-2xl transition-all ${
                    videoFile ? 'bg-brand-purple text-white hover:bg-brand-purple-light' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  AI 자막 생성 시작하기 <ChevronRight size={24} className="inline ml-2" />
                </button>
              </div>
            </div>
          ) : data?.status === 'PROCESSING' ? (
            <div className="flex-1 flex items-center justify-center"><Status progress={data.progress} isDark={isDark} /></div>
          ) : (
            <>
              <section className="flex-1 flex flex-col p-8 gap-8 min-w-0 h-full">
                <div className="flex-1 min-h-0 shadow-2xl rounded-3xl overflow-hidden">
                  <Player 
                    url={videoId} 
                    isDark={isDark} 
                    playing={playing} 
                    setPlaying={setPlaying} 
                    onDuration={setDuration} 
                    onProgress={setPlayed} 
                    playerRef={playerRef} 
                    segments={localSegments}
                  />
                </div>
              </section>
              <aside className={`w-[480px] border-l shadow-2xl transition-all duration-500 ${theme.sidebar} flex flex-col`}>
                <Editor segments={localSegments} isDark={isDark} onUpdate={(id, txt) => setLocalSegments(prev => prev.map(s => s.id === id ? {...s, corrected: txt} : s))} />
              </aside>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
