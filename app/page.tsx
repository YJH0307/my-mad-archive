'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const SUPABASE_URL = 'https://qgqdygeuxamtfscakqaf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncWR5Z2V1eGFtdGZzY2FrcWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTUxNzcsImV4cCI6MjA4MzM3MTE3N30.Z1rwozI8Z0EsJuOo7jCvxxazSA2gtCh3ri-v38OKnso';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Home() {
  const [url, setUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [videoId, setVideoId] = useState('');
  const [sourceTag, setSourceTag] = useState('');
  const [musicTag, setMusicTag] = useState('');
  const [videoList, setVideoList] = useState<any[]>([]);

  // DB에서 영상 목록 가져오기
  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setVideoList(data);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // 유튜브 URL에서 ID 추출 및 썸네일 확인
  const handleIdentify = () => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[7].length === 11) ? match[7] : '';

    if (id) {
      setVideoId(id);
      setThumbnail(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);
    } else {
      alert('올바른 유튜브 주소를 입력해주세요!');
    }
  };

  // DB에 저장
  const handleRegister = async () => {
    if (!sourceTag || !musicTag) {
      alert('태그를 모두 입력해주세요!');
      return;
    }

    const { error } = await supabase
      .from('videos')
      .insert([{ 
        youtube_id: videoId, 
        source_tag: sourceTag, 
        music_tag: musicTag 
      }]);

    if (error) {
      alert('DB 저장 실패: ' + error.message);
    } else {
      alert('성공! 아카이브에 등록되었습니다.');
      setUrl('');
      setThumbnail('');
      setSourceTag('');
      setMusicTag('');
      fetchVideos(); // 목록 갱신
    }
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2.8rem', color: '#ff0000', marginBottom: '10px', fontWeight: '900' }}>NICO-LIKE ARCHIVE</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>당신의 음MAD를 영구적으로 기록하세요.</p>
      
      {/* 입력 섹션 */}
      <div style={{ marginBottom: '40px' }}>
        <input 
          type="text" 
          placeholder="유튜브 주소를 붙여넣으세요" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ padding: '15px', width: '400px', borderRadius: '5px 0 0 5px', border: '1px solid #333', backgroundColor: '#111', color: '#fff', outline: 'none' }} 
        />
        <button 
          onClick={handleIdentify}
          style={{ padding: '15px 25px', borderRadius: '0 5px 5px 0', backgroundColor: '#ff0000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
        >
          영상 확인
        </button>
      </div>

      {/* 등록 미리보기 카드 */}
      {thumbnail && (
        <div style={{ marginBottom: '60px', backgroundColor: '#161616', padding: '30px', borderRadius: '20px', display: 'inline-block', border: '1px solid #333' }}>
          <img src={thumbnail} width="400" style={{ borderRadius: '10px', marginBottom: '20px' }} />
          <div style={{ width: '400px' }}>
            <input 
              placeholder="소스 (예: 블루아카이브, 심영)" 
              value={sourceTag} 
              onChange={(e) => setSourceTag(e.target.value)}
              style={{ width: '100%', padding: '12px', marginBottom: '10px', backgroundColor: '#000', border: '1px solid #333', color: '#fff', boxSizing: 'border-box' }}
            />
            <input 
              placeholder="원곡 (예: 나이트 오브 나이츠)" 
              value={musicTag} 
              onChange={(e) => setMusicTag(e.target.value)}
              style={{ width: '100%', padding: '12px', marginBottom: '20px', backgroundColor: '#000', border: '1px solid #333', color: '#fff', boxSizing: 'border-box' }}
            />
            <button 
              onClick={handleRegister}
              style={{ width: '100%', padding: '15px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              아카이브 등록하기
            </button>
          </div>
        </div>
      )}

      <div style={{ width: '90%', height: '1px', backgroundColor: '#222', margin: '0 auto 50px auto' }}></div>

      {/* 아카이브 목록 리스트 */}
      <h2 style={{ textAlign: 'left', maxWidth: '1200px', margin: '0 auto 30px auto', paddingLeft: '20px' }}>최신 아카이브</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto', padding: '0 20px 100px 20px' }}>
        {videoList.map((video) => (
          <div key={video.id} style={{ backgroundColor: '#161616', borderRadius: '12px', overflow: 'hidden', border: '1px solid #222', transition: 'transform 0.2s' }}>
            {/* 썸네일 클릭 시 이동 */}
            <a href={`https://www.youtube.com/watch?v=${video.youtube_id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{ position: 'relative' }}>
                <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} width="100%" alt="Thumbnail" style={{ display: 'block' }} />
                <div style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: 'rgba(0,0,0,0.8)', padding: '2px 5px', fontSize: '0.7rem', color: '#fff' }}>PLAY ▶</div>
              </div>
            </a>
            
            <div style={{ padding: '20px', textAlign: 'left' }}>
              <div style={{ marginBottom: '15px' }}>
                <span style={{ fontSize: '0.7rem', color: '#ff0000', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>SOURCE</span>
                <span style={{ fontSize: '1rem', color: '#eee' }}>{video.source_tag}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#0070f3', fontWeight: 'bold', display: 'block', marginBottom: '3px' }}>MUSIC</span>
                <span style={{ fontSize: '1rem', color: '#eee' }}>{video.music_tag}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}