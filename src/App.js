import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { 
  Video,
  Folder,
  User,
  Download,
  Sparkles,
  Moon,
  Sun,
  Search,
  X,
  FileVideo,
  Check,
  ChevronRight 
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
  
  // [수정] 화면에는 'formal', 'casual'만 관리
  const [subtitleType, setSubtitleType] = useState('formal');
  const [searchTerm, setSearchTerm] = useState("");
  
  const [duration, setDuration] = useState(0); 
  const [played, setPlayed] = useState(0); 
  const playerRef = useRef(null);

  // useProcessing에는 내부적으로 매핑된 도메인 전송
  const internalDomain = subtitleType === 'formal' ? 'politics' : 'ent';
  const { data } = useProcessing(serverFileId, internalDomain);

  useEffect(() => {
    if (data?.segments) setLocalSegments(data.segments);
  }, [data]);

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
    const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!rawBaseUrl || rawBaseUrl === "undefined") {
      alert("Vercel 환경 변수가 설정되지 않았습니다.");
      return;
    }
    const baseUrl = rawBaseUrl.replace(/\/$/, "");

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      // [수정] 선택한 타입에 따라 백엔드 도메인 키 매핑 전송
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

  // [수정] 화면에 보여줄 옵션은 딱 두 개
  const typeOptions = [
    { id: 'formal', name: '문어체', desc: '정치 / 사회 / 뉴스 스타일' },
    { id: 'casual', name: '구어체', desc: '연예 / 여행 / 휴가 스타일' },
  ];

  const theme = {
    bg: isDark ? "bg-[#0A0C14]" : "bg-[#F8FAFC]",
    sidebar: isDark ? "bg-[#11131F] border-gray-800/50" : "bg-white border-gray-200 shadow-sm",
    card: isDark ? "bg-[#11131F] border-gray-800/50" : "bg-white border-transparent shadow-xl",
    uploadZone: isDark ? "bg-[#0A0C14] border-gray-700/50" : "bg-[#F1F5F9] border-slate-200",
  };

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-500 ${theme.bg} ${theme.text}`}>
      <aside className={`w-24 flex flex-col items-center py-10 border-r transition-all duration-500 ${theme.sidebar} z-20`}>
        <div className="w-14 h-14 bg-brand-purple rounded-3xl flex items-center justify-center shadow-lg mb-12 shrink-0">
          <Video size={32} className="text-white" fill="currentColor" />
        </div>
        <button onClick={() => setIsDark(!isDark)} className="p-3 rounded-2xl hover:bg-slate-200 transition-all">
          {isDark ? <Sun size={30} className="text-gray-600" /> : <Moon size={30} className="text-slate-400" />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-24 border-b flex items-center justify-between px-12 z-10">
          <h1 className="text-3xl font-black italic">AI SUBTITLE PRO</h1>
          <button disabled={!serverFileId} className={`px-8 py-4 rounded-2xl font-bold transition-all text-sm ${serverFileId ? 'bg-brand-purple text-white' : 'bg-slate-200 text-slate-400'}`}>
            <Download size={22} className="inline mr-2" /> 내보내기
          </button>
        </header>

        <main className="flex-1 flex overflow-hidden min-h-0">
          {!serverFileId && data?.status === 'IDLE' ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className={`w-full max-w-5xl p-14 rounded-[48px] border ${theme.card}`}>
                <h2 className="text-[32px] font-extrabold mb-12 flex items-center gap-4">
                  <Sparkles className="text-brand-purple" size={32} /> 새로운 프로젝트
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
                      <p className="text-lg font-bold">{videoFile ? videoFile.name : "클릭하거나 드래그하여 업로드하세요."}</p>
                    </label>
                  </div>
                </div>

                {/* 스타일 선택 영역 (가시성 해결 포함) */}
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
                            : isDark ? 'bg-[#08090F] border-gray-800/40' : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                          subtitleType === option.id ? 'bg-white border-white' : isDark ? 'border-gray-700' : 'border-slate-300'
                        }`}>
                          {subtitleType === option.id && <Check size={18} className="text-brand-purple" strokeWidth={3} />}
                        </div>
                        <div>
                          <p className={`font-bold text-lg ${subtitleType === option.id ? 'text-white' : isDark ? 'text-gray-400' : 'text-slate-600'}`}>{option.name}</p>
                          <p className={`text-[11px] font-black tracking-widest mt-1 uppercase ${subtitleType === option.id ? 'text-white/70' : isDark ? 'text-gray-600' : 'text-slate-400'}`}>{option.desc}</p>
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
            /* 로딩 및 편집 화면 로직 유지 */
            <div className="flex-1 flex overflow-hidden">
               {/* 이전에 구현한 Player(미리보기 포함)와 Editor 컴포넌트 호출 */}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
