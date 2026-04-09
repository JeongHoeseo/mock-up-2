import { useState, useEffect } from 'react';
import { fetchStatus } from '../services/api';

export const useProcessing = (videoId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!videoId) return;

    setLoading(true);
    const interval = setInterval(async () => {
      const result = await fetchStatus(videoId);
      setData(result);
      if (result.status === 'EDITING') clearInterval(interval);
    }, 3000); // 3초마다 체크

    return () => clearInterval(interval);
  }, [videoId]);

  return { data, loading };
};

export default useProcessing;
