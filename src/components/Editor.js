import React from 'react';
import { Sparkles, History, CheckCircle2 } from 'lucide-react';

const Editor = ({ segments, onUpdate, isDark }) => {
  return (
    <div className={`h-full flex flex-col transition-colors duration-500 ${isDark ? 'bg-[#161927]' : 'bg-white'}`}>
      
      {/* 1. 상단 헤더: 원래 시안의 넓은 여백과 폰트 사이즈 복구 */}
      <div className={`p-8 border-b transition-colors ${isDark ? 'border-gray-800/50' : 'border-gray-100'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Sparkles className="text-brand-purple" size={22} />
            <div>
              <h3 className={`font-bold text-2xl tracking-tighter italic ${isDark ? 'text-white' : 'text-gray-900'}`}>
                자막 편집
              </h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">AI OPTIMIZED WORKFLOW</p>
            </div>
          </div>
          <button className={`p-2.5 rounded-xl transition-all ${isDark ? 'bg-gray-800/50 text-gray-500 hover:text-white' : 'bg-gray-100 text-gray-400'}`}>
            <History size={20} />
          </button>
        </div>
      </div>

      {/* 2. 자막 리스트: 원래 시안의 '빌어먹게 큰' 카드 사이즈와 충분한 여백 복구 */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        {segments && segments.map((seg) => (
          <div 
            key={seg.id} 
            className={`rounded-2xl p-8 border transition-all group ${
              isDark 
                ? 'bg-[#1C2030] border-gray-800/30 hover:border-brand-purple/50' 
                : 'bg-white border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-brand-purple/30'
            }`}
          >
            {/* 타임스탬프 */}
            <div className="flex justify-between items-center mb-6">
              <span className={`text-[11px] font-bold px-4 py-1.5 rounded-full border font-mono tracking-widest ${
                isDark 
                  ? 'bg-gray-900/80 text-brand-purple-light border-brand-purple/20' 
                  : 'bg-brand-purple/5 text-brand-purple border-brand-purple/10'
              }`}>
                {seg.start}s - {seg.end}s
              </span>
              <CheckCircle2 size={18} className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="space-y-6">
              {/* ORIGINAL STT: 다시 잘 보이게 복구 */}
              <div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] block mb-2">ORIGINAL STT</span>
                <p className={`text-[14px] italic leading-relaxed font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {seg.text}
                </p>
              </div>

              {/* CORRECTED AI: 넓은 입력창 복구 */}
              <div className="relative">
                <span className="text-[10px] font-black text-brand-purple uppercase tracking-[0.2em] block mb-3">CORRECTED AI</span>
                <textarea
                  className={`w-full border rounded-2xl p-5 text-[15px] focus:outline-none focus:ring-4 focus:ring-brand-purple/10 focus:border-brand-purple transition-all resize-none leading-normal font-medium ${
                    isDark 
                      ? 'bg-[#0F111A]/80 border-gray-800/50 text-gray-200' 
                      : 'bg-gray-50 border-gray-200 text-gray-800 shadow-inner'
                  }`}
                  rows={3}
                  value={seg.corrected}
                  onChange={(e) => onUpdate(seg.id, e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. 하단 버튼: 원래의 큼직한 버튼으로 복구 */}
      <div className={`p-8 border-t transition-colors ${isDark ? 'border-gray-800/50' : 'border-gray-100'}`}>
        <button className="w-full bg-brand-purple hover:bg-brand-purple-light text-white py-5 rounded-2xl font-black transition-all shadow-2xl shadow-brand-purple/30 text-sm uppercase tracking-[0.2em]">
          최종 자막 적용 및 다운로드
        </button>
      </div>
    </div>
  );
};

export default Editor;
