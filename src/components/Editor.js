import React from 'react';
import { Sparkles, History } from 'lucide-react';

const Editor = ({ segments, onUpdate, isDark }) => {
  return (
    <div className={`h-full flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#161927]' : 'bg-white'}`}>
      
      {/* 1. 상단 헤더: 두 번째 사진처럼 아주 슬림하게 */}
      <div className={`px-5 py-4 border-b transition-colors ${isDark ? 'border-gray-800/50' : 'border-gray-100'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sparkles className="text-brand-purple" size={16} />
            <div>
              <h3 className={`font-bold text-[15px] tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                자막 편집
              </h3>
              <p className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">AI OPTIMIZED WORKFLOW</p>
            </div>
          </div>
          <button className={`p-1.5 rounded-lg ${isDark ? 'bg-gray-800/50 text-gray-500 hover:text-white' : 'bg-gray-100 text-gray-400'}`}>
            <History size={16} />
          </button>
        </div>
      </div>

      {/* 2. 자막 리스트: 두 번째 사진의 촘촘한 간격과 컴팩트한 카드 사이즈 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {segments && segments.map((seg) => (
          <div 
            key={seg.id} 
            className={`rounded-xl p-4 border transition-all ${
              isDark 
                ? 'bg-[#1C2030] border-gray-800/30' 
                : 'bg-white border-gray-100'
            }`}
          >
            {/* 타임스탬프: 작고 슬림하게 */}
            <div className="flex justify-between items-center mb-2.5">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border font-mono tracking-tighter ${
                isDark 
                  ? 'bg-gray-900/80 text-brand-purple-light border-brand-purple/20' 
                  : 'bg-brand-purple/5 text-brand-purple border-brand-purple/10'
              }`}>
                {seg.start}s - {seg.end}s
              </span>
            </div>
            
            <div className="space-y-2.5">
              {/* ORIGINAL STT */}
              <div>
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block mb-0.5">ORIGINAL STT</span>
                <p className={`text-[11px] italic font-medium leading-tight ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {seg.text}
                </p>
              </div>

              {/* CORRECTED AI: 슬림한 텍스트박스 */}
              <div className="relative">
                <span className="text-[8px] font-bold text-brand-purple uppercase tracking-widest block mb-1">CORRECTED AI</span>
                <textarea
                  className={`w-full border rounded-lg p-3 text-[12px] focus:outline-none focus:border-brand-purple transition-all resize-none leading-snug ${
                    isDark 
                      ? 'bg-[#0F111A]/80 border-gray-800/50 text-gray-200' 
                      : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                  rows={2} // 딱 2줄로 슬림하게 고정
                  value={seg.corrected}
                  onChange={(e) => onUpdate(seg.id, e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. 하단 버튼: 컴팩트한 하단 고정 버튼 */}
      <div className={`p-4 border-t ${isDark ? 'border-gray-800/50' : 'border-gray-100'}`}>
        <button className="w-full bg-brand-purple hover:bg-brand-purple-light text-white py-3 rounded-xl font-bold transition-all text-[11px] uppercase tracking-widest">
          최종 자막 적용 및 다운로드
        </button>
      </div>
    </div>
  );
};

export default Editor;
