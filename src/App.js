import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import {
  Video,
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

const domainMap = {
  general: [],
  formal: [
    { id: 'social_news', name: '사회/뉴스', desc: 'Social & News' },
    { id: 'politics', name: '정치', desc: 'Politics' },
  ],
  casual: [
    { id: 'ent', name: '연예/엔터', desc: 'Entertainment' },
    { id: 'vacation', name: '여행/휴가', desc: 'Vacation' },
  ],
};

function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [localSegments, setLocalSegments] = useState([]);
  const [isDark, setIsDark] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [subtitleType, setSubtitleType] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState('general');
  const [renderEngine, setRenderEngine] = useState('opencv');
  const [searchTerm, setSearchTerm] = useState('');
  const [jobStatus, setJobStatus] = useState(initialJobStatus);
  const [polling, setPolling] = useState(false);
  const [processResult, setProcessResult] = useState(null);

  const playerRef = useRef(null);

  const baseUrl = useMemo(() => API_BASE_URL.replace(/\/$/, ''), []);

  const getAbsoluteUrl = (url) => {
    if (!url) return null;

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    return `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;
  };

  const resultVideoUrl = getAbsoluteUrl(
    processResult?.downloads?.video_download_url
  );

  const resultSubtitleUrl = getAbsoluteUrl(
    processResult?.downloads?.subtitle_download_url
  );

  const previewVideoUrl = resultVideoUrl || videoUrl;

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

          setJobStatus((prev) => ({
            ...prev,
            status: job.status || prev.status,
            step: job.step || prev.step,
            message: job.message || prev.message,
            progress:
              typeof job.progress === 'number' ? job.progress : prev.progress,
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
            setPlaying(false);

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

          if (status === 'failed' || status === 'error' || step === 'failed') {
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
  }, [polling, jobStatus.jobId, renderEngine, baseUrl]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const setSelectedVideo = (file) => {
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('비디오 파일만 업로드 가능합니다.');
      return;
    }

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setLocalSegments([]);
    setProcessResult(null);
    setPolling(false);
    setPlaying(false);
    setPlayed(0);
    setDuration(0);
    setJobStatus(initialJobStatus);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;

    if (files && files.length > 0) {
      setSelectedVideo(files[0]);
    }
  };

  const handleStartAI = async () => {
    if (!videoFile) return;

    try {
      setLocalSegments([]);
      setProcessResult(null);
      setPolling(false);
      setPlaying(false);

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

      const uploadRes = await axios.post(`${baseUrl}/upload/process`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

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
    if (!resultVideoUrl) {
      alert('영상 파일이 없습니다.');
      return;
    }

    window.open(resultVideoUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadSubtitle = () => {
    if (!resultSubtitleUrl) {
      alert('SRT 파일이 없습니다.');
      return;
    }

    window.open(resultSubtitleUrl, '_blank', 'noopener,noreferrer');
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
    subText: isDark ? 'text-slate-400' : 'text-slate-500',
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
  const isFailed = normalizedStatus === 'failed' || normalizedStatus === 'error';

  const safeDuration = duration > 0 ? duration : 1;

  return (
    <div
      className={`min-h-screen flex transition-colors duration-500 ${theme.bg} ${theme.text}`}
    >
      <aside
        className={`w-24 shrink-0 border-r flex flex-col items-center py-8 gap-6 ${theme.sidebar}`}
      >
        <button className="w-14 h-14 rounded-2xl bg-brand-purple flex items-center justify-center shadow-lg shadow-brand-purple/30">
          <Sparkles size={30} className="text-white" fill="currentColor" />
        </button>

        <button
          onClick={() => setIsDark(!isDark)}
          className="p-3 rounded-2xl hover:bg-slate-200/10 transition-all"
        >
          {isDark ? (
            <Sun size={30} className="text-yellow-300" />
          ) : (
            <Moon size={30} className="text-slate-500" />
          )}
        </button>

        <div className="mt-auto p-3">
          <User size={30} className="text-slate-400" />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={`h-24 border-b backdrop-blur-xl flex items-center justify-between px-12 z-10 transition-all duration-500 ${theme.header}`}
        >
          <h1 className={`text-3xl font-black tracking-tighter italic ${theme.text}`}>
            AI SUBTITLE PRO
          </h1>

          <div className="flex items-center gap-3">
            <button
              disabled={!resultVideoUrl}
              onClick={handleDownloadVideo}
              className={`px-6 py-4 rounded-2xl font-bold flex items-center gap-2.5 transition-all text-sm shadow-lg ${
                resultVideoUrl
                  ? 'bg-brand-purple hover:bg-brand-purple-light text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Download size={22} />
              영상 다운로드
            </button>

            <button
              disabled={!resultSubtitleUrl}
              onClick={handleDownloadSubtitle}
              className={`px-6 py-4 rounded-2xl font-bold flex items-center gap-2.5 transition-all text-sm shadow-lg ${
                resultSubtitleUrl
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Download size={22} />
              SRT 다운로드
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {isIdle ? (
            <div className="flex-1 overflow-y-auto p-6">
              <div
                className={`w-full max-w-3xl mx-auto p-8 rounded-[32px] border transition-all duration-500 ${theme.card}`}
              >
                <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3">
                  <Video className="text-brand-purple" />
                  새로운 AI 자막 프로젝트
                </h2>

                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-[28px] p-10 text-center cursor-pointer transition-all ${theme.uploadZone}`}
                >
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedVideo(file);
                      }
                    }}
                  />

                  <label
                    htmlFor="video-upload"
                    className="cursor-pointer flex flex-col items-center gap-4"
                  >
                    <div className="w-20 h-20 rounded-3xl bg-brand-purple/10 flex items-center justify-center">
                      <FileVideo size={38} className="text-brand-purple" />
                    </div>

                    <div>
                      <p className="text-lg font-black">
                        {videoFile
                          ? videoFile.name
                          : '클릭하거나 드래그하여 업로드하세요.'}
                      </p>
                      <p className={`text-sm mt-2 ${theme.subText}`}>
                        MP4, MOV, WEBM 등 비디오 파일을 업로드할 수 있습니다.
                      </p>
                    </div>
                  </label>
                </div>

                {videoUrl && (
                  <div className="mt-8 rounded-[28px] overflow-hidden bg-black border border-gray-800">
                    <div className="h-[360px]">
                      <Player
                        url={videoUrl}
                        playing={playing}
                        setPlaying={setPlaying}
                        onDuration={setDuration}
                        onProgress={setPlayed}
                        playerRef={playerRef}
                        objectPosition="center center"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <h3 className="text-lg font-black mb-4">자막 스타일 선택</h3>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        setSubtitleType('general');
                        setSelectedDomain('general');
                      }}
                      className={`p-5 rounded-[24px] border-2 transition-all font-bold ${
                        subtitleType === 'general'
                          ? 'bg-brand-purple border-brand-purple text-white'
                          : 'bg-white border-transparent text-black'
                      }`}
                    >
                      일반
                    </button>

                    <button
                      onClick={() => {
                        setSubtitleType('formal');
                        setSelectedDomain('social_news');
                      }}
                      className={`p-5 rounded-[24px] border-2 transition-all font-bold ${
                        subtitleType === 'formal'
                          ? 'bg-brand-purple border-brand-purple text-white'
                          : 'bg-white border-transparent text-black'
                      }`}
                    >
                      문어체
                    </button>

                    <button
                      onClick={() => {
                        setSubtitleType('casual');
                        setSelectedDomain('ent');
                      }}
                      className={`p-5 rounded-[24px] border-2 transition-all font-bold ${
                        subtitleType === 'casual'
                          ? 'bg-brand-purple border-brand-purple text-white'
                          : 'bg-white border-transparent text-black'
                      }`}
                    >
                      구어체
                    </button>
                  </div>

                  {subtitleType && domainMap[subtitleType].length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-4">
                      {domainMap[subtitleType].map((option) => (
                        <button
                          key={option.id}
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

                <div className="mt-8">
                  <h3 className="text-lg font-black mb-4">
                    자막 렌더링 방식 선택
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {renderOptions.map((option) => (
                      <button
                        key={option.id}
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
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                            renderEngine === option.id
                              ? 'border-white bg-white text-brand-purple'
                              : 'border-slate-400'
                          }`}
                        >
                          {renderEngine === option.id && <Check size={18} />}
                        </div>

                        <div>
                          <p className="text-lg font-black">{option.name}</p>
                          <p
                            className={`text-sm mt-1 ${
                              renderEngine === option.id
                                ? 'text-white/80'
                                : theme.subText
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
                  className={`w-full mt-8 py-6 rounded-[28px] font-black text-lg shadow-2xl transition-all ${
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
            <div className="flex flex-1 flex-row overflow-hidden h-full bg-black/5">
              <section className="flex-1 flex flex-col p-8 justify-start items-start min-w-0 h-full relative">
                <div className="relative w-full max-w-5xl h-[70vh] min-h-[360px] rounded-3xl overflow-hidden bg-black shadow-2xl group border border-gray-800">
                  <Player
                    url={previewVideoUrl}
                    isDark={isDark}
                    playing={playing}
                    setPlaying={setPlaying}
                    onDuration={setDuration}
                    onProgress={setPlayed}
                    playerRef={playerRef}
                    segments={localSegments}
                    objectPosition="left top"
                  />
                </div>

                <div className="w-full max-w-5xl mt-6 h-3 bg-white/10 rounded-full relative overflow-hidden shadow-inner border border-white/5">
                  {localSegments.map((seg) => {
                    const start = Number(seg.start || 0);
                    const end = Number(seg.end || start);
                    const left = Math.max(
                      0,
                      Math.min(100, (start / safeDuration) * 100)
                    );
                    const width = Math.max(
                      0,
                      Math.min(
                        100 - left,
                        ((end - start) / safeDuration) * 100
                      )
                    );

                    return (
                      <div
                        key={`timeline-${seg.id}`}
                        className="absolute h-full bg-brand-purple/50 border-x border-black/10"
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                        }}
                      />
                    );
                  })}

                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(255,255,255,1)] z-50 rounded-full"
                    style={{
                      left: `${Math.max(0, Math.min(100, played * 100))}%`,
                      transition: 'left 0.1s linear',
                    }}
                  />
                </div>

                {resultVideoUrl && (
                  <p className="w-full max-w-5xl mt-4 text-sm text-slate-400">
                    현재 미리보기는 백엔드에서 생성된 최종 자막 영상입니다.
                  </p>
                )}
              </section>

              <aside
                className={`w-[440px] shrink-0 border-l h-full flex flex-col ${
                  isDark
                    ? 'bg-[#11131F] border-gray-800/50'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="p-5 border-b border-gray-800/30">
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${theme.searchBar}`}
                  >
                    <Search size={18} className="text-slate-400" />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="자막 검색"
                      className="bg-transparent outline-none w-full text-sm"
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
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-3xl">
                <Status
                  progress={jobStatus.progress}
                  jobStatus={jobStatus}
                  isDark={isDark}
                />

                {isFailed && (
                  <div className="mt-6 rounded-3xl bg-red-500/10 border border-red-500/30 p-6 text-red-200">
                    <p className="font-black mb-2">처리 실패</p>
                    <p className="text-sm">
                      {jobStatus.message || '작업 중 오류가 발생했습니다.'}
                    </p>

                    <button
                      onClick={() => setJobStatus(initialJobStatus)}
                      className="mt-5 px-5 py-3 rounded-2xl bg-red-500 text-white font-bold"
                    >
                      처음으로 돌아가기
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
