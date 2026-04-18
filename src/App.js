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
  const [subtitleStyle, setSubtitleStyle] = useState('formal');
  const [searchTerm, setSearchTerm] = useState("");
  
  const [duration, setDuration] = useState(0); 
  const [played, setPlayed] = useState(0); 
  const playerRef = useRef(null);

  const { data } = useProcessing(serverFileId, subtitleStyle);

  useEffect(() => {
    if (data?.segments) setLocalSegments(data.segments);
  }, [data]);

  // [추가] 드래그 앤 드롭 핸들러
  const handleDragOver = (e) => {
    e.preventDefault(); // 브라우저 기본 동작 방지
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
      } else {
        alert("비디오 파일만 업로드 가능합니다.");
      }
    }
  };

  const handleStartAI = async () => {
    if (!videoFile) return;
    const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!rawBaseUrl || rawBaseUrl === "undefined") {
      alert("Vercel 환경 변수가 설정되지 않았습니다.");
      return;
    }
    const baseUrl = rawBaseUrl.replace(/\/$/, "");

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      const uploadRes = await axios.post(`${baseUrl}/upload/process`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setServerFileId(uploadRes.data.file_id);
    } catch (err) {
      console.error("서버 전송 실패:", err);
      alert("영상 업로드 중 오류가 발생했습니다.");
    }
  };

  const theme = {
    bg: isDark ? "bg-[#0A0C14]" : "bg-[#F8FAFC]",
    sidebar: isDark ? "bg-[#11131F] border-gray-800/50" : "bg-white border-gray-200 shadow-sm",
    header: isDark ? "bg-[#11131F]/60 border-gray-800/50" : "bg-white/80 border-gray-200 shadow-sm",
    text: isDark ? "text-white" : "text-[#1E293B]",
    card: isDark ? "bg-[#11131F] border-gray-800/50" : "bg-white border-transparent shadow-xl",
    uploadZone: isDark ? "bg-[#0A0C14] border-gray-700/50" : "bg-[#F1F5F9] border-slate-200",
  };

  const styleOptions = [
    { id: 'formal', name: '문어체', desc: 'FORMAL STYLE' },
    { id: 'casual', name: '구어체', desc: 'CASUAL STYLE' },
  ];

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-500 ${theme.bg} ${theme.text}`}>
      <aside className={`w-24 flex flex-col items-center py-10 border-r transition-all duration-500 ${theme.sidebar} z-20`}>
        <div className="w-14 h-14 bg-brand-purple rounded-3xl flex items-center justify-center shadow-lg mb-12 shrink-0">
          <Video size={32} className="text-white" fill="currentColor" />
        </div>
        <div className="flex flex-col items-center gap-12 relative w-full">
          <button onClick={() => setIsDark(!isDark)} className="p-3 rounded-2xl hover:bg-slate-200 transition-all">
            {isDark ? <Sun size={30} className="text-gray-600" fill="currentColor" /> : <Moon size={30} className="text-slate-400" fill="currentColor" />}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className={`h-24 border-b flex items-center justify-between px-12 z-10 transition-all duration-500 ${theme.header}`}>
          <h1 className={`text-3xl font-black italic ${theme.text}`}>AI SUBTITLE PRO</h1>
          <button disabled={!serverFileId} className={`px-8 py-4 rounded-2xl font-bold transition-all text-sm ${serverFileId ? 'bg-brand-purple text-white' : 'bg-slate-200 text-slate-400'}`}>
            <Download size={22} className="inline mr-2" /> 내보내기
          </button>
        </header>

        <main className="flex-1 flex overflow-hidden min-h-0">
          {!serverFileId && data?.status === 'IDLE' ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className={`w-full max-w-5xl p-14 rounded-[48px] border transition-all duration-500 ${theme.card}`}>
                <h2 className="text-[32px] font-extrabold mb-12 flex items-center gap-4">
                  <Sparkles className="text-brand-purple" size={32} /> 새로운 프로젝트
                </h2>

                <div className="mb-12">
                  {/* [수정] 드래그 앤 드롭 이벤트 연결 */}
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

                {/* 스타일 선택 (가시성 유지) */}
                <div className="mb-14">
                  <h3 className="text-xl font-bold mb-6">스타일 선택</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {styleOptions.map(option => (
                      <button key={option.id} onClick={() => setSubtitleStyle(option.id)}
                        className={`p-7 rounded-[28px] border-2 transition-all flex items-center gap-5 text-left ${
                          subtitleStyle === option.id 
                            ? 'bg-brand-purple border-brand-purple text-white shadow-xl' 
                            : isDark ? 'bg-[#08090F] border-gray-800/40' : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${subtitleStyle === option.id ? 'bg-white' : isDark ? 'border-gray-700' : 'border-slate-300'}`}>
                          {subtitleStyle === option.id && <Check size={18} className="text-brand-purple" />}
                        </div>
                        <div>
                          <p className={`font-bold text-lg ${subtitleStyle === option.id ? 'text-white' : isDark ? 'text-gray-400' : 'text-slate-600'}`}>{option.name}</p>
                          <p className={`text-[11px] font-black uppercase mt-1 ${subtitleStyle === option.id ? 'text-white/70' : isDark ? 'text-gray-600' : 'text-slate-400'}`}>{option.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleStartAI} disabled={!videoFile} className={`w-full py-6 rounded-[28px] font-black text-lg ${videoFile ? 'bg-brand-purple text-white' : 'bg-slate-200 text-slate-400'}`}>
                  AI 자막 생성 시작하기 <ChevronRight size={24} className="inline ml-2" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex">
               {/* 로딩 및 편집 화면 (기존 동일) */}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
