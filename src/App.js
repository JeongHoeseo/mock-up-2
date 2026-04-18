import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  ChevronRight,
} from 'lucide-react';

import Player from './components/Player';
import Editor from './components/Editor';
import Status from './components/Status';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);

  const [localSegments, setLocalSegments] = useState([]);
  const [isDark, setIsDark] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [subtitleStyle, setSubtitleStyle] = useState('formal');
  const [searchTerm, setSearchTerm] = useState('');

  const [duration, setDuration] = useState(0);
  const [played, setPlayed] = useState(0);
  const playerRef = useRef(null);

  const [phase, setPhase] = useState('idle'); // idle | processing | done
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [processResult, setProcessResult] = useState(null);

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const filteredSegments = useMemo(() => {
    return localSegments.filter((seg) =>
      (seg.corrected || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [localSegments, searchTerm]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setProcessResult(null);
    setLocalSegments([]);
    setErrorMessage('');
    setPhase('idle');
    setProgress(0);
  };

  const pollJobUntilDone = async (baseUrl, jobId) => {
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');

    while (true) {
      const res = await axios.get(`${cleanBaseUrl}/jobs/${jobId}`);
      const job = res.data;

      console.log('[JOB]', job.status, job.step, job.progress, job.message);

      if (typeof job.progress === 'number') {
        setProgress(job.progress);
      }

      if (job.status === 'done') {
        if (!job.pipeline_result) {
          throw new Error('작업은 완료되었지만 pipeline_result가 없습니다.');
        }

        return job.pipeline_result;
      }

      if (job.status === 'failed') {
        throw new Error(job.error || '영상 처리 작업이 실패했습니다.');
      }

      await sleep(2000);
    }
  };

  const handleStartAI = async () => {
    if (!videoFile) {
      alert('먼저 영상을 선택하세요.');
      return;
    }

    const baseUrl = process.env.REACT_APP_API_BASE_URL;

    if (!baseUrl || baseUrl === 'undefined') {
      alert('REACT_APP_API_BASE_URL 환경변수가 설정되지 않았습니다.');
      return;
    }

    setErrorMessage('');
    setPhase('processing');
    setProgress(5);
    setProcessResult(null);
    setLocalSegments([]);

    try {
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');

      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('domain', 'general');

      const startRes = await axios.post(
        `${cleanBaseUrl}/upload/process`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      /*
        새 백엔드 구조:
        {
          status: "queued",
          job_id: "..."
        }

        혹시 백엔드가 아직 예전 구조라면:
        {
          status: "success",
          pipeline_result: {...}
        }
        이것도 임시 호환 처리한다.
      */
      let result = null;

      if (startRes.data?.job_id) {
        setProgress(10);
        result = await pollJobUntilDone(baseUrl, startRes.data.job_id);
      } else if (startRes.data?.pipeline_result) {
        result = startRes.data.pipeline_result;
      } else {
        throw new Error('백엔드에서 job_id 또는 pipeline_result를 받지 못했습니다.');
      }

      const backendSegments = result?.transcription?.segments ?? [];

      const mappedSegments = backendSegments.map((seg, index) => ({
        ...seg,
        id: seg.id ?? index,
        corrected: seg.corrected ?? seg.text ?? '',
      }));

      setLocalSegments(mappedSegments);
      setProcessResult(result || null);
      setProgress(100);
      setPhase('done');
    } catch (err) {
      console.error('서버 처리 실패:', err);

      let detail = '영상 업로드 또는 처리 중 오류가 발생했습니다.';

      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          detail = err.response.data.detail;
        } else {
          detail = JSON.stringify(err.response.data.detail);
        }
      } else if (err.message) {
        detail = err.message;
      }

      setErrorMessage(detail);
      setPhase('idle');
      setProgress(0);
      alert(detail);
    }
  };

  const handleExport = () => {
    const videoDownloadUrl = processResult?.downloads?.video_download_url;
    const subtitleDownloadUrl = processResult?.downloads?.subtitle_download_url;

    if (videoDownloadUrl) {
      window.open(videoDownloadUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (subtitleDownloadUrl) {
      window.open(subtitleDownloadUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    alert('다운로드 가능한 결과가 아직 없습니다.');
  };

  const theme = {
    bg: isDark ? 'bg-[#0A0C14]' : 'bg-[#F8FAFC]',
    sidebar: isDark
      ? 'bg-[#11131F] border-gray-800/50'
      : 'bg-white border-gray-200 shadow-sm',
    header: isDark
      ? 'bg-[#11131F]/60 border-gray-800/50'
      : 'bg-white/80 border-gray-200 shadow-sm',
    text: isDark ? 'text-white' : 'text-[#1E293B]',
    subText: isDark ? 'text-gray-500' : 'text-slate-400',
    card: isDark
      ? 'bg-[#11131F] border-gray-800/50'
      : 'bg-white border-transparent shadow-xl',
    uploadZone: isDark
      ? 'bg-[#0A0C14] border-gray-700/50'
      : 'bg-[#F1F5F9] border-slate-200',
    optionBtn: isDark
      ? 'bg-[#0A0C14] border-transparent'
      : 'bg-slate-50 border-slate-100',
    searchBar: isDark
      ? 'bg-[#1C2030] border-gray-800/50'
      : 'bg-slate-100 border-slate-200',
    timeline: isDark
      ? 'bg-[#161927] border-gray-800'
      : 'bg-white border-gray-200',
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
          <button className="p-3 rounded-2xl bg-brand-purple/10 transition-colors">
            <Folder size={30} className="text-brand-purple" fill="currentColor" />
          </button>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-3 rounded-2xl hover:bg-slate-200 transition-all"
          >
            {isDark ? (
              <Sun size={30} className="text-gray-600" fill="currentColor" />
            ) : (
              <Moon size={30} className="text-slate-400" fill="currentColor" />
            )}
          </button>
        </div>

        <div className="mt-auto p-3">
          <User size={30} className="text-slate-300" fill="currentColor" />
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className={`h-24 border-b backdrop-blur-xl flex items-center justify-between px-12 z-10 transition-all duration-500 ${theme.header}`}>
          <h1 className={`text-3xl font-black tracking-tighter italic ${theme.text}`}>
            AI SUBTITLE PRO
          </h1>

          <button
            disabled={!processResult}
            onClick={handleExport}
            className={`px-8 py-4 rounded-2xl font-bold flex items-center gap-2.5 transition-all text-sm shadow-lg ${
              processResult
                ? 'bg-brand-purple hover:bg-brand-purple-light text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Download size={22} />
            내보내기
          </button>
        </header>

        <main className="flex-1 flex overflow-hidden min-h-0">
          {phase === 'idle' && (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className={`w-full max-w-5xl p-14 rounded-[48px] border transition-all duration-500 ${theme.card}`}>
                <h2 className="text-[32px] font-extrabold mb-12 flex items-center gap-4">
                  <Sparkles className="text-brand-purple" size={32} />
                  새로운 AI 자막 프로젝트
                </h2>

                <div className="mb-12">
                  <div className={`border-2 border-dashed rounded-[32px] p-12 text-center cursor-pointer transition-all hover:border-brand-purple group ${theme.uploadZone}`}>
                    <input
                      type="file"
                      id="video-upload"
                      className="hidden"
                      accept=".mp4,.mov,.avi,.mkv,video/*"
                      onChange={handleFileChange}
                    />

                    <label htmlFor="video-upload" className="cursor-pointer">
                      <FileVideo size={64} className="text-slate-300 group-hover:text-brand-purple mx-auto mb-6" />
                      <p className="text-lg font-bold mb-2">
                        {videoFile ? videoFile.name : '클릭하거나 드래그하여 업로드하세요.'}
                      </p>
                      <p className={`text-sm ${theme.subText}`}>
                        허용 형식: mp4, mov, avi, mkv
                      </p>
                    </label>
                  </div>
                </div>

                <div className="mb-14 flex flex-col gap-6">
                  <h3 className="text-xl font-bold">스타일 선택</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {styleOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSubtitleStyle(option.id)}
                        className={`p-7 rounded-[28px] border-2 transition-all flex items-center gap-5 text-left ${
                          subtitleStyle === option.id
                            ? 'bg-brand-purple border-brand-purple text-white shadow-xl'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center ${
                          subtitleStyle === option.id ? 'bg-white' : 'border-slate-300'
                        }`}>
                          {subtitleStyle === option.id && (
                            <Check size={18} className="text-brand-purple" />
                          )}
                        </div>

                        <div>
                          <p className="font-bold text-lg">{option.name}</p>
                          <p className="text-[11px] opacity-60 uppercase tracking-widest">
                            {option.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {errorMessage && (
                  <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 px-5 py-4 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                <button
                  onClick={handleStartAI}
                  className={`w-full py-6 rounded-[28px] font-black text-lg shadow-2xl transition-all ${
                    videoFile ? 'bg-brand-purple text-white' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  AI 자막 생성 시작하기
                  <ChevronRight size={24} className="inline ml-2" />
                </button>
              </div>
            </div>
          )}

          {phase === 'processing' && (
            <div className="flex-1 flex items-center justify-center">
              <Status progress={progress} />
            </div>
          )}

          {phase === 'done' && (
            <>
              <section className="flex-1 flex flex-col p-8 gap-8 min-w-0 h-full">
                <div className="flex-1 min-h-0 shadow-2xl">
                  <Player
                    url={videoUrl}
                    playing={playing}
                    setPlaying={setPlaying}
                    onDuration={setDuration}
                    onProgress={setPlayed}
                    playerRef={playerRef}
                  />
                </div>

                <div className={`h-32 rounded-3xl p-6 border shadow-inner overflow-hidden transition-all duration-500 ${theme.timeline}`}>
                  <div className="flex justify-between items-center mb-4 text-[10px] font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-brand-purple rounded-full" />
                      <span className={theme.subText}>자막 분포 타임라인</span>
                    </div>
                    <span className="text-gray-500 font-mono">
                      Total: {localSegments.length} Segments
                    </span>
                  </div>

                  <div className="relative h-6 w-full bg-gray-500/10 rounded-lg flex items-center overflow-hidden border border-gray-800/20">
                    {duration > 0 &&
                      localSegments.map((seg) => {
                        const left = (seg.start / duration) * 100;
                        const width = Math.max(((seg.end - seg.start) / duration) * 100, 0.5);

                        return (
                          <div
                            key={seg.id}
                            className="absolute h-full bg-brand-purple/40 border-x border-brand-purple/20 hover:bg-brand-purple transition-all cursor-pointer"
                            style={{ left: `${left}%`, width: `${width}%` }}
                            onClick={() => playerRef.current?.seekTo(seg.start)}
                          />
                        );
                      })}

                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_white] z-20 pointer-events-none transition-all duration-100"
                      style={{ left: `${(played * 100).toFixed(2)}%` }}
                    />
                  </div>

                  <div className="mt-3 flex justify-between text-[9px] text-gray-500 font-mono tracking-tighter uppercase">
                    <span>00:00:00 START</span>
                    <span>
                      {isNaN(duration)
                        ? '00:00:00'
                        : new Date(duration * 1000).toISOString().slice(11, 19)} END
                    </span>
                  </div>
                </div>
              </section>

              <aside className={`w-[480px] border-l shadow-2xl transition-all duration-500 ${theme.sidebar} flex flex-col`}>
                <div className="p-4 border-b border-gray-800/30">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${theme.searchBar}`}>
                    <Search size={16} className="text-gray-500" />
                    <input
                      type="text"
                      placeholder="자막 검색..."
                      className="bg-transparent outline-none text-sm w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <X
                        size={16}
                        className="text-gray-500 cursor-pointer"
                        onClick={() => setSearchTerm('')}
                      />
                    )}
                  </div>
                </div>

                <Editor
                  segments={filteredSegments}
                  isDark={isDark}
                  onUpdate={(id, txt) =>
                    setLocalSegments((prev) =>
                      prev.map((s) =>
                        s.id === id ? { ...s, corrected: txt } : s
                      )
                    )
                  }
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
