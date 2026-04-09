import React from 'react';
import { Sparkles, History, Pencil } from 'lucide-react';

const Editor = ({ segments, onUpdate, isDark }) => {
  return (
    <div className={`h-full flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#161927]' : 'bg-white'}`}>
      {/* 1. 상단 헤더: 내보내기 버튼 삭제, 깔끔한 타이틀만 유지 */}
      <div className={`p-5 border-b transition-colors ${isDark ? 'border-gray-800/50 bg-[#161927]/90' : 'border-gray-200 bg-gray-50/50'} backdrop-blur-md sticky top-0 z-10`}>
        <div className="flex justify-between items-center">
          <div>
            <h3 className={`font-bold text-lg flex items-center gap-2 italic ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <Sparkles className="text-brand-purple" size={18} /> 자막 편집
            </h3>
            <p className={`text-[9px] mt-0.5 uppercase tracking-[0.2em] font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>AI Optimized Workflow</p>
          </div>
          {/* 복원 버튼만 우측에 배치 */}
          <button className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-gray-800/50 text-gray-400 hover:text-white' : 'bg-gray-200 text-gray-500 hover:text-gray-700'}`} title="복원">
            <History size={18} />
          </button>
        </div>
      </div>

      {/* 2. 자막 리스트: 패딩을 더 줄여서 슬림하게 변경 */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-3 transition-colors ${isDark ? 'bg-[#0F111A]/40' : 'bg-gray-100/50'}`}>
        {segments && segments.map((seg) => (
          <div key={seg.id} className={`rounded-xl p-3 border transition-all group shadow-sm ${isDark ? 'bg-[#1C2030] border-gray-800/30 hover:border-brand-purple/50' : 'bg-white border-gray-200 hover:border-brand-purple/50'}`}>
            <div className="flex justify-between items-center mb-1.5">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border font-mono tracking-widest ${isDark ? 'bg-gray-900/80 text-brand-purple-light border-brand-purple/20' : 'bg-blue-50 text-brand-purple border-brand-purple/10'}`}>
                {seg.start}s - {seg.end}s
              </span>
              <Pencil size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
            
            <div className="relative">
              <textarea
                className={`w-full border rounded-lg p-2 text-[13px] focus:outline-none focus:border-brand-purple transition-all resize-none leading-snug font-medium ${isDark ? 'bg-[#0F111A]/60 border-gray-800/50 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                rows={2}
                value={seg.corrected}
                onChange={(e) => onUpdate(seg.id, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 3. 하단 저장 버튼 */}
      <div className={`p-4 border-t transition-colors ${isDark ? 'bg-[#161927] border-gray-800/50' : 'bg-white border-gray-200'}`}>
        <button className="w-full bg-brand-purple hover:bg-brand-purple-light text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand-purple/20 text-sm tracking-tight">
          최종 자막 적용 및 다운로드
        </button>
      </div>
    </div>
  );
};

export default Editor;