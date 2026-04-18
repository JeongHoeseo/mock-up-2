import React from 'react';

function Status({ progress = 0, jobStatus = {}, isDark = true }) {
  const safeProgress = Math.max(0, Math.min(100, Number(progress || 0)));

  const step = jobStatus?.step || 'processing';
  const message = jobStatus?.message || '문맥에 최적화된 자막을 생성하고 있습니다.';
  const renderEngine =
    jobStatus?.renderEngine ||
    jobStatus?.render_engine ||
    'opencv';

  const llmUsed = jobStatus?.llmUsed;
  const llmFallbackUsed = jobStatus?.llmFallbackUsed;
  const llmFallbackReason = jobStatus?.llmFallbackReason;
  const timings = jobStatus?.timings;

  const engineLabel =
    String(renderEngine).toLowerCase() === 'ffmpeg'
      ? 'FFmpeg 렌더링'
      : 'OpenCV 렌더링';

  const engineDesc =
    String(renderEngine).toLowerCase() === 'ffmpeg'
      ? '싱크 안정 / 처리 빠름'
      : '디자인 좋음 / 처리 느림';

  const stepLabelMap = {
    upload: '영상 업로드',
    queued: '작업 대기',
    audio_extraction: '오디오 추출',
    transcription: 'Whisper 전사',
    llm_refinement: 'LLM 자막 보정',
    normalize_segments: '자막 분할 정리',
    generate_srt: 'SRT 생성',
    render_video: '최종 영상 렌더링',
    done: '완료',
    failed: '실패',
  };

  const stepLabel = stepLabelMap[step] || step;

  return (
    <div
      className={`flex flex-col items-center justify-center p-12 rounded-3xl shadow-xl border max-w-md w-full transition-all ${
        isDark
          ? 'bg-[#11131F] border-gray-800/60 text-white'
          : 'bg-white border-gray-100 text-gray-900'
      }`}
    >
      <div className="relative w-32 h-32 mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            className={isDark ? 'text-gray-800 stroke-current' : 'text-gray-100 stroke-current'}
            strokeWidth="10"
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
          />

          <circle
            className="text-blue-600 stroke-current transition-all duration-500"
            strokeWidth="10"
            strokeLinecap="round"
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (251.2 * safeProgress) / 100}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-blue-600">
          {Math.round(safeProgress)}%
        </div>
      </div>

      <h3 className="text-xl font-bold">
        AI 자막 처리 중...
      </h3>

      <p
        className={`text-sm mt-2 text-center ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}
      >
        {message}
      </p>

      <div
        className={`mt-6 w-full rounded-2xl p-4 border ${
          isDark
            ? 'bg-[#0A0C14] border-gray-800 text-gray-300'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex justify-between text-sm mb-2">
          <span className="font-bold">현재 단계</span>
          <span>{stepLabel}</span>
        </div>

        <div className="flex justify-between text-sm mb-2">
          <span className="font-bold">렌더링 방식</span>
          <span>{engineLabel}</span>
        </div>

        <div className="flex justify-between text-xs opacity-70">
          <span>특징</span>
          <span>{engineDesc}</span>
        </div>
      </div>

      <div
        className={`mt-4 w-full rounded-2xl p-4 border ${
          isDark
            ? 'bg-[#0A0C14] border-gray-800 text-gray-300'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}
      >
        <div className="flex justify-between text-sm mb-2">
          <span className="font-bold">LLM 보정</span>
          <span>
            {llmUsed === true
              ? '사용됨'
              : llmUsed === false
              ? '미사용'
              : '대기 중'}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="font-bold">Fallback</span>
          <span>
            {llmFallbackUsed === true
              ? '발생'
              : llmFallbackUsed === false
              ? '없음'
              : '대기 중'}
          </span>
        </div>

        {llmFallbackReason && (
          <p className="text-xs mt-2 opacity-70 break-words">
            사유: {llmFallbackReason}
          </p>
        )}
      </div>

      {timings && (
        <div
          className={`mt-4 w-full rounded-2xl p-4 border text-xs ${
            isDark
              ? 'bg-[#0A0C14] border-gray-800 text-gray-400'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}
        >
          <div className="flex justify-between mb-1">
            <span>전사</span>
            <span>{timings.transcription_seconds ?? '-'}s</span>
          </div>

          <div className="flex justify-between mb-1">
            <span>LLM 보정</span>
            <span>{timings.llm_refinement_seconds ?? '-'}s</span>
          </div>

          <div className="flex justify-between mb-1">
            <span>렌더링</span>
            <span>{timings.render_video_seconds ?? '-'}s</span>
          </div>

          <div className="flex justify-between font-bold">
            <span>총 처리</span>
            <span>{timings.total_seconds ?? '-'}s</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Status;
