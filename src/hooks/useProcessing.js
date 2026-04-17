import { useState, useEffect } from 'react';
import axios from 'axios';

// Vite 환경 변수 호출 (Vercel 설정과 일치해야 함)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const useProcessing = (serverFileId, subtitleStyle) => {
  const [data, setData] = useState({ status: 'IDLE', progress: 0, segments: [] });

  useEffect(() => {
    // 서버에서 발급한 실제 ID가 있을 때만 폴링 시작
    if (!serverFileId || serverFileId.startsWith('blob:')) return;

    let pollInterval;

    const startProcessing = async () => {
      try {
        setData({ status: 'PROCESSING', progress: 5, segments: [] });
        
        // 1. AI 자막 생성 작업 요청
        const response = await axios.post(`${API_BASE_URL}/subtitles/generate`, {
          file_id: serverFileId,
          style: subtitleStyle
        });

        const jobId = response.data.job_id;

        // 2. 작업 상태 확인 (폴링)
        pollInterval = setInterval(async () => {
          try {
            const statusRes = await axios.get(`${API_BASE_URL}/subtitles/status/${jobId}`);
            const { status, progress, segments } = statusRes.data;

            if (status === 'COMPLETED') {
              setData({ status: 'COMPLETED', progress: 100, segments });
              clearInterval(pollInterval);
            } else if (status === 'FAILED') {
              setData({ status: 'ERROR', progress: 0, segments: [] });
              clearInterval(pollInterval);
            } else {
              setData(prev => ({ ...prev, status, progress }));
            }
          } catch (err) {
            console.error("상태 확인 실패:", err);
          }
        }, 3000);

      } catch (error) {
        console.error("작업 생성 실패:", error);
        setData({ status: 'ERROR', progress: 0, segments: [] });
      }
    };

    startProcessing();
    return () => clearInterval(pollInterval);
  }, [serverFileId, subtitleStyle]);

  return { data };
};

export default useProcessing;
