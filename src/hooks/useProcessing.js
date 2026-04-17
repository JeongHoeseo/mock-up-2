import { useState, useEffect } from 'react';
import axios from 'axios';

// Vercel 환경 변수에서 API 주소를 가져옵니다. 
// Vite 사용 시: import.meta.env.VITE_API_BASE_URL
// CRA 사용 시: process.env.REACT_APP_API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://api.yourserver.com"; 

const useProcessing = (videoId, subtitleStyle) => {
  const [data, setData] = useState({ status: 'IDLE', progress: 0, segments: [] });

  useEffect(() => {
    // videoId가 단순히 로컬 blob URL인 경우 서버 처리가 불가능하므로, 
    // 실제 서버에 업로드된 후 반환된 ID나 경로가 들어왔을 때 실행되어야 합니다.
    if (!videoId || videoId.startsWith('blob:')) return; 

    let pollInterval;

    const startProcessing = async () => {
      try {
        setData({ status: 'PROCESSING', progress: 10, segments: [] });
        
        const response = await axios.post(`${API_BASE_URL}/subtitles/generate`, {
          video_id: videoId, // 서버가 인식할 수 있는 파일 ID
          style: subtitleStyle
        });

        const jobId = response.data.job_id;

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
          } catch (pollError) {
            console.error("폴링 중 에러:", pollError);
          }
        }, 3000);

      } catch (error) {
        console.error("작업 요청 에러:", error);
        setData({ status: 'ERROR', progress: 0, segments: [] });
      }
    };

    startProcessing();

    return () => clearInterval(pollInterval);
  }, [videoId, subtitleStyle]);

  return { data };
};

export default useProcessing;
