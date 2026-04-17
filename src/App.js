import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Video, Folder, User, Download, 
  Sparkles, Moon, Sun, Search, X, FileVideo, Check, ChevronRight
} from 'lucide-react';
import Player from './components/Player';
import Editor from './components/Editor';
import useProcessing from './hooks/useProcessing';

function App() {
  // --- 상태 관리 ---
  const [videoId, setVideoId] = useState(null);
  const [localSegments, setLocalSegments] = useState([]);
  const [isDark, setIsDark] = useState(true); 
  const [playing, setPlaying] = useState(false);
  const [subtitleStyle, setSubtitleStyle] = useState('formal'); // 기본 문어체
  const [searchTerm, setSearchTerm] = useState("");
  
  const [duration, setDuration] = useState(0); 
  const [played, setPlayed] = useState(0); 
  const playerRef = useRef(null);

  // --- 데이터 로드 (Mock API) ---
  const { data } = useProcessing(videoId, subtitleStyle);

  useEffect(() => {
    if (data?.segments) setLocalSegments(data.segments);
  }, [data]);

  const filteredSegments = useMemo(() => {
    return localSegments.filter(seg => 
      seg.corrected.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [localSegments, searchTerm]);

  // --- 단축키 시스템 (10초 이동) ---
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

  // --- 시간 포맷 함수 ---
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00:00";
    const date = new Date(seconds * 1000);
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  // --- 테마 설정 (가시성 및 클릭 유도성 강화) ---
  const theme = {
    bg: isDark ? "bg-[#0A0C14]" : "bg-[#F3F4F6]",
    sidebar: isDark ? "bg-[#11131F] border-gray-800/50" : "bg-white border-gray-200 shadow-sm",
    header: isDark ? "bg-[#11131F]/60 border-gray-800/50" : "bg-white/80 border-gray-200",
    text: isDark ? "text-white" : "text-gray-900",
    subText: isDark ? "text-gray-500" : "text-gray-400",
    card: isDark ? "bg-[#11131F] border-gray-800/50" : "bg-white border-gray-200 shadow-xl", // 중앙 박스 배경
    uploadZone: isDark ? "bg-[#0A0C14] border-gray-700/50" : "bg-gray-50 border-gray-300", // 업로드 존 배경
    searchBar: isDark ? "bg-[#1C2030] border-gray-800/50" : "bg-white border-gray-300"
  };

  // 자막 스타일 옵션 데이터
  const styleOptions = [
    { id: 'formal', name: '문어체', desc: '~입니다, ~합니다.' },
    { id: 'casual', name: '구어체', desc: '~에요, ~거예요.' },
  ];

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-500 ${theme.bg} ${theme.text}`}>
      
      {/* 1. 사이드바 (아이콘 Bold 스타일 및 활성화 바 적용) */}
      <aside className={`w-24 flex flex-col items-center py-10 border-r transition-all duration-500 ${theme.sidebar} z-20`}>
        <div className="w-14 h-14 bg-brand-purple rounded-3xl flex items-center justify-center shadow-lg shadow-brand-purple/20 mb-12 shrink-0">
          <Video size={32} className="text-white" fill="currentColor" />
        </div>
        <div className="flex flex-col items-center gap-12 relative w-full">
          {/* 활성화 상태 바 (Vertical Bar) */}
          <div className="absolute left-0 top-0 w-1 h-12 bg-brand-purple rounded-r-full" style={{ transform: 'translateY(0px)' }} />
          
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
        
        {/* 2. 헤더 (내보내기 버튼 비활성화 상태 적용) */}
        <header className={`h-24 border-b backdrop-blur-xl flex items-center justify-between px-12 z-10 transition-all duration-500 ${theme.header}`}>
          <h1 className={`text-3xl font-black tracking-tighter italic ${theme.text}`}>AI SUBTITLE PRO</h1>
          
          {/* 내보내기 버튼: 파일 업로드 전 비활성화(채도 낮춤) */}
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

        {/* 3. 메인 작업대 (Step 시스템 및 시작하기 버튼 배치) */}
        <main className="flex-1 flex overflow-hidden min-h-0">
          {!videoId ? (
            // 프로젝트 생성 단계 (UX 개편된 업로드 영역)
            <div className="flex-1 flex items-center justify-center p-12 bg-[#080A11]">
              <div className={`w-full max-w-5xl p-12 rounded-[40px] border shadow-2xl ${theme.card}`}>
                
                <h2 className="text-[28px] font-extrabold tracking-tighter mb-10 flex items-center gap-3">
                  <Sparkles className="text-brand-purple" size={26} />
                  새로운 AI 자막 프로젝트 시작하기
                </h2>

                {/* Step 1: 영상 업로드 */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-7 h-7 bg-brand-purple rounded-full flex items-center justify-center text-xs font-bold text-white">1</span>
                    <h3 className="text-lg font-bold">영상 업로드</h3>
                  </div>
                  
                  {/* 업로드 존: 대비 강화 및 Hover 효과 */}
                  <div className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all hover:border-brand-purple group ${theme.uploadZone}`}>
                    <input type="file" id="video-upload" className="hidden" accept="video/*" onChange={(e) => {
                      if (e.target.files[0]) {
                        setVideoId(URL.createObjectURL(e.target.files[0]));
                      }
                    }} />
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <FileVideo size={56} className="text-gray-600 group-hover:text-brand-purple transition-colors mx-auto mb-6" />
                      <p className="text-base font-medium text-gray-300 mb-1.5 group-hover:text-white transition-colors">여기를 클릭하거나 영상을 드래그하여 업로드하세요.</p>
                      <p className={`text-[13px] ${theme.subText}`}>MP4, MOV, AVI... (최대 2GB)</p>
                    </label>
                  </div>
                </div>

                {/* Step 2: 자막 스타일 선택 (기존 상단 영역 통합) */}
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
                            ? 'bg-brand-purple border-brand-purple' 
                            : `${theme.uploadZone} hover:border-gray-600`
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${subtitleStyle === option.id ? 'bg-white border-white' : 'border-gray-600'}`}>
                          {subtitleStyle === option.id && <Check size={16} className="text-brand-purple" />}
                        </div>
                        <div>
                          <p className={`font-bold ${subtitleStyle === option.id ? 'text-white' : theme.text}`}>{option.name}</p>
                          <p className={`text-[11px] ${subtitleStyle === option.id ? 'text-brand-purple-light' : theme.subText}`}>{option.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 시작하기 버튼 (중앙 하단에 크게 배치) */}
                <button 
                  onClick={() => { if (videoId) console.log('시작하기'); }} // 실제 시작 로직 연결
                  className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all text-base shadow-lg shadow-brand-purple/20 ${
                  videoId 
                    ? 'bg-brand-purple hover:bg-brand-purple-light text-white' 
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}>
                  AI 자막 생성 시작하기
                  <ChevronRight size={22} />
                </button>

              </div>
            </div>
          ) : data?.status === 'PROCESSING' ? (
            // ... (기존 PROCESSING 로직 동일)
          ) : (
            // 자막 편집 단계 (기존 로직 동일)
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
