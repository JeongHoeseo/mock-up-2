import React from 'react';
import { Sparkles, History, CheckCircle2 } from 'lucide-react';

const Editor = ({ segments, onUpdate, isDark }) => {
  return (
    // 전체 높이를 부모에 맞추고 flex-col 설정
    <div className={`h-full flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#161927]' : 'bg-white'}`}>
      
      {/* 검색 바 아래의 자막 편집 헤더 (이미지 디자인 유지) */}
      <div className={`p-6 border-b transition-colors ${isDark ? 'border-gray-800/50' : 'border-gray-100'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-purple/10 rounded-lg flex items-center justify-center">
              <Sparkles className="text-brand-purple" size={18} />
            </div>
            <div>
              <h3 className={`font-bold text-xl tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                자막 편집
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">AI Optimized Workflow</p>
            </div>
          </div>
          <button className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-100 text-gray-400'}`}>
            <History size={18} />
          </button>
        </div>
      </div>

      {/* [수정 핵심] 자막 리스트 영역: 이 부분만 휠 스크롤이 작동함 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {segments && segments.map((seg) => (
          <div 
            key={seg.id} 
            className={`rounded-2xl p-6 border transition-all group ${
              isDark 
                ? 'bg-[#1C2030] border-gray-800/30 hover:border-brand-purple/50' 
                : 'bg-white border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-brand-purple/30'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <span className={`text-[11px] font-bold px-3 py-1 rounded-full border font-mono ${
                isDark 
                  ? 'bg-gray-900/80 text-brand-purple-light border-brand-purple/20' 
                  : 'bg-brand-purple/5 text-brand-purple border-brand-purple/10'
              }`}>
                {seg.start}s - {seg.end}s
              </span>
              <CheckCircle2 size={16} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="space-y-4">
              {/* ORIGINAL STT */}
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Original STT</span>
                <p className={`text-[13px] italic font-medium leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {seg.text}
                </p>
              </div>

              {/* CORRECTED AI */}
              <div className="relative">
                <span className="text-[10px] font-black text-brand-purple uppercase tracking-widest block mb-2">Corrected AI</span>
                <textarea
                  className={`w-full border rounded-xl p-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all resize-none leading-normal font-medium ${
                    isDark 
                      ? 'bg-[#0F111A]/60 border-gray-800/50 text-gray-200' 
                      : 'bg-gray-50/50 border-gray-200 text-gray-800'
                  }`}
                  rows={2}
                  value={seg.corrected}
                  onChange={(e) => onUpdate(seg.id, e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 하단 버튼 (이미지처럼 아래에 고정) */}
      <div className={`p-6 border-t ${isDark ? 'border-gray-800/50' : 'border-gray-100'}`}>
        <button className="w-full bg-brand-purple hover:bg-brand-purple-light text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-brand-purple/20 text-sm tracking-wide">
          최종 자막 적용 및 다운로드
        </button>
      </div>
    </div>
  );
};

export default Editor;
