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
  FileVideo,
  Check,
  ChevronRight,
} from 'lucide-react';

import Player from './components/Player';
import Editor from './components/Editor';
import Status from './components/Status';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://relay-resulting-turning-mathematical.trycloudflare.com';

const initialJobStatus = {
  jobId: '',
  status: '',
  step: '',
  message: '',
  progress: 0,
  llmUsed: null,
  llmServiceUrl: '',
  llmFallbackUsed: null,
  llmFallbackReason: '',
  timings: null,
  renderEngine: 'opencv',
};

// 기존 상태들 사이에 추가
const [subtitleType, setSubtitleType] = useState(null); // 'formal' (문어체) 또는 'casual' (구어체)
const [selectedDomain, setSelectedDomain] = useState('general'); // 실제 백엔드 전송용 키값

// 2단계 선택을 위한 도메인 매핑 데이터
const domainMap = {
  formal: [
    { id: 'social_news', name: '사회/뉴스', desc: 'Social & News' },
    { id: 'politics', name: '정치', desc: 'Politics' }
  ],
  casual: [
    { id: 'ent', name: '연예/엔터', desc: 'Entertainment' },
    { id: 'vacation', name: '여행/휴가', desc: 'Vacation' }
  ]
};

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);

  const [localSegments, setLocalSegments] = useState([]);
  const [isDark, setIsDark] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);

  const [subtitleType, setSubtitleType] = useState('formal');
  const [renderEngine, setRenderEngine] = useState('opencv');
  const [searchTerm, setSearchTerm] = useState('');

  const [jobStatus, setJobStatus] = useState(initialJobStatus);
  const [polling, setPolling] = useState(false);
  const [processResult, setProcessResult] = useState(null);

  const playerRef = useRef(null);

  const internalDomain = subtitleType === 'formal' ? 'politics' : 'ent';

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  useEffect(() => {
    let timer;

    if (polling && jobStatus.jobId) {
      timer = setInterval(async () => {
        try {
          const baseUrl = API_BASE_URL.replace(/\/$/, '');
          const res = await axios.get(`${baseUrl}/jobs/${jobStatus.jobId}`, {
            timeout: 15000,
          });

          const job = res.data;
          const status = String(job.status || '').toLowerCase();
          const step = String(job.step || '').toLowerCase();
          const pipelineResult = job.pipeline_result;

          const transcription = pipelineResult?.transcription;
          const timings = pipelineResult?.timings;
          const resultRenderEngine =
            job.render_engine ||
            pipelineResult?.render_engine ||
            pipelineResult?.render?.engine ||
            renderEngine;

          console.log('[JOB]', status, step, job.progress, job.message);

          setJobStatus((prev) => ({
            ...prev,
            status: job.status || prev.status,
            step: job.step || prev.step,
            message: job.message || prev.message,
            progress:
              typeof job.progress === 'number'
                ? job.progress
                : prev.progress,

            renderEngine: resultRenderEngine || prev.renderEngine,

            llmUsed:
              transcription?.llm_used !== undefined
                ? transcription.llm_used
                : prev.llmUsed,

            llmServiceUrl:
              transcription?.llm_service_url !== undefined
                ? transcription.llm_service_url
                : prev.llmServiceUrl,

            llmFallbackUsed:
              transcription?.llm_fallback_used !== undefined
                ? transcription.llm_fallback_used
                : prev.llmFallbackUsed,

            llmFallbackReason:
              transcription?.llm_fallback_reason !== undefined
                ? transcription.llm_fallback_reason
                : prev.llmFallbackReason,

            timings: timings || prev.timings,
          }));

          if (
            status === 'done' ||
            status === 'completed' ||
            status === 'success' ||
            step === 'done'
          ) {
            setPolling(false);

            const backendSegments =
              pipelineResult?.transcription?.segments ?? [];

            const mappedSegments = backendSegments.map((seg, index) => ({
              ...seg,
              id: seg.id ?? index,
              corrected: seg.corrected ?? seg.text ?? '',
            }));

            setLocalSegments(mappedSegments);
            setProcessResult(pipelineResult || null);

            setJobStatus((prev) => ({
              ...prev,
              status: 'COMPLETED',
              step: 'done',
              progress: 100,
              renderEngine: resultRenderEngine || prev.renderEngine,
              message: '전체 영상 자막 처리가 완료되었습니다.',
            }));

            return;
          }

          if (
            status === 'failed' ||
            status === 'error' ||
            step === 'failed'
          ) {
            setPolling(false);

            setJobStatus((prev) => ({
              ...prev,
              status: 'FAILED',
              step: 'failed',
              progress: 0,
              renderEngine: resultRenderEngine || prev.renderEngine,
              message: job.error || job.message || '작업이 실패했습니다.',
            }));
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 2000);
    }

    return () => clearInterval(timer);
  }, [polling, jobStatus.jobId, renderEngine]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const setSelectedVideo = (file) => {
    if (!file) return;

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setLocalSegments([]);
    setProcessResult(null);
    setPolling(false);
    setJobStatus(initialJobStatus);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;

    if (files && files.length > 0) {
      const file = files[0];

      if (file.type.startsWith('video/')) {
        setSelectedVideo(file);
      } else {
        alert('비디오 파일만 업로드 가능합니다.');
      }
    }
  };

  const handleStartAI = async () => {
    if (!videoFile) return;

    try {
      setLocalSegments([]);
      setProcessResult(null);
      setPolling(false);

      setJobStatus({
        ...initialJobStatus,
        status: 'UPLOADING',
        step: 'upload',
        progress: 3,
        renderEngine,
        message: '영상을 업로드하는 중입니다.',
      });

      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('domain', selectedDomain);
      formData.append('render_engine', renderEngine);

      const baseUrl = API_BASE_URL.replace(/\/$/, '');
      const uploadRes = await axios.post(
        `${baseUrl}/upload/process`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
        }
      );

      const jobId = uploadRes.data?.job_id;

      if (!jobId) {
        throw new Error('백엔드에서 job_id를 받지 못했습니다.');
      }

      setJobStatus((prev) => ({
        ...prev,
        jobId,
        status: 'PENDING',
        step: 'queued',
        progress: 5,
        renderEngine: uploadRes.data?.render_engine || renderEngine,
        message: uploadRes.data?.message || '영상 처리가 시작되었습니다.',
      }));

      setPolling(true);
    } catch (err) {
      console.error('Upload fail:', err);

      setPolling(false);

      setJobStatus((prev) => ({
        ...prev,
        status: 'FAILED',
        step: 'failed',
        progress: 0,
        message:
          err.response?.data?.detail ||
          err.message ||
          '업로드 중 오류가 발생했습니다.',
      }));
    }
  };

  const handleDownloadVideo = () => {
    const videoDownloadUrl = processResult?.downloads?.video_download_url;

    if (!videoDownloadUrl) {
      alert('영상 파일이 없습니다.');
      return;
    }

    window.open(videoDownloadUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadSubtitle = () => {
    const subtitleDownloadUrl = processResult?.downloads?.subtitle_download_url;

    if (!subtitleDownloadUrl) {
      alert('SRT 파일이 없습니다.');
      return;
    }

    window.open(subtitleDownloadUrl, '_blank', 'noopener,noreferrer');
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
    card: isDark
      ? 'bg-[#11131F] border-gray-800/50'
      : 'bg-white border-transparent shadow-xl',
    uploadZone: isDark
      ? 'bg-[#0A0C14] border-gray-700/50'
      : 'bg-[#F1F5F9] border-slate-200',
    searchBar: isDark
      ? 'bg-[#1C2030] border-gray-800/50'
      : 'bg-slate-100 border-slate-200',
  };

  const typeOptions = [
    { id: 'formal', name: '문어체', desc: '정치 / 사회 / 뉴스 스타일' },
    { id: 'casual', name: '구어체', desc: '연예 / 게임 / 브이로그 스타일' },
  ];

  const renderOptions = [
    {
      id: 'opencv',
      name: 'OpenCV',
      desc: '디자인 좋음 / 처리 느림',
    },
    {
      id: 'ffmpeg',
      name: 'FFmpeg',
      desc: '싱크 안정 / 처리 빠름',
    },
  ];

  const filteredSegments = useMemo(() => {
    return localSegments.filter((s) => {
      const text = String(s.text || '').toLowerCase();
      const corrected = String(s.corrected || '').toLowerCase();
      const keyword = searchTerm.toLowerCase();

      return text.includes(keyword) || corrected.includes(keyword);
    });
  }, [localSegments, searchTerm]);

  const normalizedStatus = String(jobStatus.status || '').toLowerCase();

  const isIdle = !normalizedStatus || normalizedStatus === 'idle';

  const isDone =
    normalizedStatus === 'done' ||
    normalizedStatus === 'completed' ||
    normalizedStatus === 'success';

  const isFailed =
    normalizedStatus === 'failed' ||
    normalizedStatus === 'error';

  return (
    <div
      className={`flex h-screen font-sans overflow-hidden transition-colors duration-500 ${theme.bg} ${theme.text}`}
    >
      <aside
        className={`w-24 flex flex-col items-center py-10 border-r transition-all duration-500 ${theme.sidebar} z-20`}
      >
        <div className="w-14 h-14 bg-brand-purple rounded-3xl flex items-center justify-center shadow-lg mb-12 shrink-0">
          <Video size={32} className="text-white" fill="currentColor" />
        </div>

        <div className="flex flex-col items-center gap-12 relative w-full">
          <button
            className={`p-3 rounded-2xl transition-colors ${
              isDark ? 'bg-brand-purple/10' : 'bg-slate-100'
            }`}
          >
            <Folder
              size={30}
              className="text-brand-purple"
              fill="currentColor"
            />
          </button>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-3 rounded-2xl hover:bg-slate-200 transition-all"
          >
            {isDark ? (
              <Sun
                size={30}
                className="text-gray-600"
                fill="currentColor"
              />
            ) : (
              <Moon
                size={30}
                className="text-slate-400"
                fill="currentColor"
              />
            )}
          </button>
        </div>

        <div className="mt-auto p-3">
          <User
            size={30}
            className="text-slate-300"
            fill="currentColor"
          />
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header
          className={`h-24 border-b backdrop-blur-xl flex items-center justify-between px-12 z-10 transition-all duration-500 ${theme.header}`}
        >
          <h1
            className={`text-3xl font-black tracking-tighter italic ${theme.text}`}
          >
            AI SUBTITLE PRO
          </h1>

          <div className="flex items-center gap-3">
            <button
              disabled={!processResult}
              onClick={handleDownloadVideo}
              className={`px-6 py-4 rounded-2xl font-bold flex items-center gap-2.5 transition-all text-sm shadow-lg ${
                processResult
                  ? 'bg-brand-purple hover:bg-brand-purple-light text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Download size={22} /> 영상 다운로드
            </button>

            <button
              disabled={!processResult}
              onClick={handleDownloadSubtitle}
              className={`px-6 py-4 rounded-2xl font-bold flex items-center gap-2.5 transition-all text-sm shadow-lg ${
                processResult
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Download size={22} /> SRT 다운로드
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col min-h-0 pt-24 overflow-y-auto">
          {isIdle ? (
            <div className="flex-1 flex items-start justify-center p-6">
              <div
                className={`w-full max-w-3xl p-8 rounded-[32px] border transition-all duration-500 ${theme.card}`}
              >
                <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
                  <Sparkles className="text-brand-purple" size={28} />
                  새로운 AI 자막 프로젝트
                </h2>

                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-[24px] p-8 text-center cursor-pointer transition-all hover:border-brand-purple group ${theme.uploadZone}`}
                >
                  <input
                    type="file"
                    id="video-upload"
                    className="hidden"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedVideo(file);
                      }
                    }}
                  />

                  <label htmlFor="video-upload" className="cursor-pointer">
                    <FileVideo
                      /* 6. 아이콘 크기를 64에서 48로, 간격을 mb-6에서 mb-4로 축소 */
                      size={48}
                      className={`${
                        isDark ? 'text-gray-700' : 'text-slate-300'
                      } group-hover:text-brand-purple mx-auto mb-4`}
                    />

                    <p className="text-base font-bold mb-1">
                      {videoFile
                        ? videoFile.name
                        : '클릭하거나 드래그하여 업로드하세요.'}
                    </p>
                  </label>
                </div>
                      
<div className="mb-14 mt-12">
  <h3 className="text-xl font-bold mb-6">자막 스타일 선택</h3>

  {/* 1층: 문어체/구어체 큰 버튼 */}
  <div className="grid grid-cols-2 gap-6 mb-6">
    <button
      type="button"
      onClick={() => {
        setSubtitleType('formal');
        setSelectedDomain('social_news'); // 클릭 시 해당 카테고리의 첫 번째 도메인 자동 선택
      }}
      className={`p-7 rounded-[28px] border-2 transition-all ${
        subtitleType === 'formal' ? 'bg-brand-purple border-brand-purple text-white' : 'bg-slate-50'
      }`}
    >
      <p className="font-bold text-lg">문어체</p>
    </button>

    <button
      type="button"
      onClick={() => {
        setSubtitleType('casual');
        setSelectedDomain('ent'); // 클릭 시 해당 카테고리의 첫 번째 도메인 자동 선택
      }}
      className={`p-7 rounded-[28px] border-2 transition-all ${
        subtitleType === 'casual' ? 'bg-brand-purple border-brand-purple text-white' : 'bg-slate-50'
      }`}
    >
      <p className="font-bold text-lg">구어체</p>
    </button>
  </div>

  {/* 2층: 선택한 타입에 따른 세부 도메인 칩 (Progressive Disclosure) */}
  {subtitleType && (
    <div className="flex justify-center gap-3 p-4 bg-slate-100 rounded-2xl animate-fade-in">
      {domainMap[subtitleType].map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => setSelectedDomain(option.id)}
          className={`px-6 py-2 rounded-full border-2 font-bold transition-all ${
            selectedDomain === option.id 
            ? 'bg-white text-brand-purple border-brand-purple' 
            : 'bg-transparent text-slate-400 border-slate-200'
          }`}
        >
          {option.name}
        </button>
      ))}
    </div>
  )}
</div>

                <div className="mb-14">
                  <h3 className="text-xl font-bold mb-6">
                    자막 렌더링 방식 선택
                  </h3>

                  <div className="grid grid-cols-2 gap-6">
                    {renderOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setRenderEngine(option.id)}
                        className={`p-7 rounded-[28px] border-2 transition-all flex items-center gap-5 text-left ${
                          renderEngine === option.id
                            ? 'bg-brand-purple border-brand-purple text-white shadow-xl shadow-brand-purple/20'
                            : isDark
                            ? 'bg-[#08090F] border-gray-800/40'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${
                            renderEngine === option.id
                              ? 'bg-white border-white'
                              : isDark
                              ? 'border-gray-700'
                              : 'border-slate-300'
                          }`}
                        >
                          {renderEngine === option.id && (
                            <Check
                              size={18}
                              className="text-brand-purple"
                              strokeWidth={3}
                            />
                          )}
                        </div>

                        <div>
                          <p
                            className={`font-bold text-lg ${
                              renderEngine === option.id
                                ? 'text-white'
                                : isDark
                                ? 'text-gray-400'
                                : 'text-slate-600'
                            }`}
                          >
                            {option.name}
                          </p>

                          <p
                            className={`text-[11px] font-black tracking-widest mt-1 uppercase ${
                              renderEngine === option.id
                                ? 'text-white/70'
                                : isDark
                                ? 'text-gray-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {option.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStartAI}
                  disabled={!videoFile}
                  className={`w-full py-6 rounded-[28px] font-black text-lg shadow-2xl transition-all ${
                    videoFile
                      ? 'bg-brand-purple text-white hover:bg-brand-purple-light'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  AI 자막 생성 시작하기
                  <ChevronRight size={24} className="inline ml-2" />
                </button>
              </div>
            </div>
          ) : isDone ? (
            <>
              <section className="flex-1 flex flex-col p-8 gap-8 min-w-0 h-full">
                <div className="flex-1 min-h-0 shadow-2xl rounded-3xl overflow-hidden bg-black relative group">
                  <Player
                    url={videoUrl}
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

              <aside
                className={`w-[480px] border-l shadow-2xl transition-all duration-500 ${theme.sidebar} flex flex-col`}
              >
                <div className="p-4 border-b border-gray-800/30">
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${theme.searchBar}`}
                  >
                    <Search size={16} className="text-gray-500" />
                    <input
                      type="text"
                      placeholder="자막 검색..."
                      className="bg-transparent outline-none text-sm w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
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
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Status
                progress={Number(jobStatus.progress || 0)}
                jobStatus={jobStatus}
                isDark={isDark}
                theme={theme}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
