// src/services/api.js
export const uploadVideo = async (file) => {
  console.log("Uploading...", file.name);
  return { videoId: "v123", status: "PROCESSING" };
};

export const fetchStatus = async (videoId) => {
  // 목업 단계에서 최종 페이지를 바로 보기 위해 status를 "EDITING"으로 고정합니다.
  return { 
    status: "EDITING", 
    progress: 100,
    segments: [
      { id: 1, start: 0, end: 2, text: "안녕하새요.", corrected: "안녕하세요." },
      { id: 2, start: 3, end: 5, text: "전처리 중입니따.", corrected: "전처리 중입니다." },
      { id: 3, start: 6, end: 8, text: "자막 편집기 디자인입니다.", corrected: "자막 편집기 디자인입니다." }
    ]
  };
};

export default { uploadVideo, fetchStatus };