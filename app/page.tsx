'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. Supabase 연결 설정
const SUPABASE_URL = 'https://qgqdygeuxamtfscakqaf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncWR5Z2V1eGFtdGZzY2FrcWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTUxNzcsImV4cCI6MjA4MzM3MTE3N30.Z1rwozI8Z0EsJuOo7jCvxxazSA2gtCh3ri-v38OKnso';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Home() {
  // 상태 관리 (유저, 입력값, 목록 등)
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [url, setUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [videoId, setVideoId] = useState('');
  const [sourceTag, setSourceTag] = useState('');
  const [musicTag, setMusicTag] = useState('');
  const [videoList, setVideoList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);

  // 2. 초기 로드: 로그인 상태 확인 및 영상 목록 가져오기
  useEffect(() => {
    // 현재 로그인된 유저 가져오기
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    
    // 로그인 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchVideos();
    return () => subscription.unsubscribe();
  }, []);

  // --- 인증 관련 함수 ---
  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert("회원가입 에러: " + error.message); 
    else alert('회원가입 성공! 이제 로그인해 주세요.');
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("로그인 실패: " + error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert('로그아웃 되었습니다.');
  };

  // --- 영상 관리 관련 함수 ---
  const fetchVideos = async () => {
    const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
    if (data) setVideoList(data);
  };

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

  const handleRegister = async () => {
    if (!user) return alert('로그인이 필요합니다!');
    const { error } = await supabase.from('videos').insert([{ 
      youtube_id: videoId, 
      source_tag: sourceTag, 
      music_tag: musicTag,
      user_id: user.id // 누가 올렸는지 ID 저장
    }]);

    if (error) alert(error.message); 
    else {
      alert('등록 성공!');
      setUrl(''); setThumbnail(''); setSourceTag(''); setMusicTag('');
      fetchVideos();
    }
  };

  const handleDelete = async (id: number, ownerId: string) => {
    if (!user || user.id !== ownerId) {
      return alert('본인이 등록한 영상만 삭제할 수 있습니다!');
    }
    if (confirm('정말 삭제하시겠습니까?')) {
      const { error } = await supabase.from('videos').delete().eq('id', id);
      if (!error) fetchVideos();
    }
  };

  // 검색 필터링
  const filteredVideos = videoList.filter(v => 
    v.source_tag.includes(searchTerm) || v.music_tag.includes(searchTerm)
  );

  return (
    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#050505', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* 1. 로그인/계정 영역 (우측 상단) */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #333', textAlign: 'left', zIndex: 10 }}>
        {user ? (
          <div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>접속 중</div>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>{user.email}</div>
            <button onClick={handleLogout} style={{ width: '100%', padding: '5px', cursor: 'pointer', backgroundColor: '#333', color: '#fff', border: 'none' }}>로그아웃</button>
          </div>
        ) : (
          <div>
            <input placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: '5px', display: 'block', width: '180px', padding: '5px' }} />
            <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} style={{ marginBottom: '10px', display: 'block', width: '180px', padding: '5px' }} />
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={handleLogin} style={{ flex: 1, padding: '5px', cursor: 'pointer' }}>로그인</button>
              <button onClick={handleSignUp} style={{ flex: 1, padding: '5px', cursor: 'pointer' }}>회원가입</button>
            </div>
          </div>
        )}
      </div>

      <h1 style={{ fontSize: '2.5rem', color: '#ff0000', marginTop: '40px', fontWeight: '900' }}>MAD ARCHIVE AUTH</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>회원가입 후 본인의 음MAD를 아카이브하세요.</p>

      {/* 2. 등록 섹션 (로그인한 사람에게만 보임) */}
      {user ? (
        <div style={{ marginBottom: '40px', backgroundColor: '#111', padding: '20px', borderRadius: '15px', display: 'inline-block', border: '1px solid #222' }}>
          <input type="text" placeholder="유튜브 URL 입력" value={url} onChange={(e) => setUrl(e.target.value)} style={{ padding: '12px', width: '300px', backgroundColor: '#000', color: '#fff', border: '1px solid #333' }} />
          <button onClick={handleIdentify} style={{ padding: '12px 20px', backgroundColor: '#ff0000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>영상 확인</button>
          
          {thumbnail && (
            <div style={{ marginTop: '20px' }}>
              <img src={thumbnail} width="350" style={{ borderRadius: '10px' }} />
              <div style={{ marginTop: '15px' }}>
                <input placeholder="소스 태그" value={sourceTag} onChange={(e) => setSourceTag(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '5px', boxSizing: 'border-box' }} />
                <input placeholder="원곡 태그" value={musicTag} onChange={(e) => setMusicTag(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '15px', boxSizing: 'border-box' }} />
                <button onClick={handleRegister} style={{ width: '100%', padding: '12px', backgroundColor: '#fff', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>DB에 등록</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: '20px', backgroundColor: '#111', borderRadius: '10px', display: 'inline-block', marginBottom: '40px', border: '1px dashed #444' }}>
          🔒 영상을 등록하려면 로그인이 필요합니다.
        </div>
      )}

      {/* 3. 검색 영역 */}
      <div style={{ marginBottom: '40px' }}>
        <input 
          type="text" 
          placeholder="검색: 소스나 원곡 이름을 입력하세요" 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          style={{ padding: '15px', width: '80%', maxWidth: '600px', borderRadius: '30px', border: '1px solid #222', backgroundColor: '#111', color: '#fff', textAlign: 'center' }} 
        />
      </div>

      {/* 4. 목록 영역 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px', padding: '0 20px' }}>
        {filteredVideos.map((video) => (
          <div key={video.id} style={{ backgroundColor: '#111', borderRadius: '12px', overflow: 'hidden', border: '1px solid #222' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setPlayingId(video.youtube_id)}>
              <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} width="100%" alt="Thumbnail" />
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0, transition: '0.3s' }} onMouseOver={e => e.currentTarget.style.opacity=1} onMouseOut={e => e.currentTarget.style.opacity=0}>
                <span style={{ fontSize: '2rem' }}>▶</span>
              </div>
            </div>
            <div style={{ padding: '15px', textAlign: 'left' }}>
              <div style={{ fontSize: '0.7rem', color: '#ff0000', fontWeight: 'bold' }}>SOURCE</div>
              <div style={{ marginBottom: '10px' }}>{video.source_tag}</div>
              <div style={{ fontSize: '0.7rem', color: '#0070f3', fontWeight: 'bold' }}>MUSIC</div>
              <div>{video.music_tag}</div>
              
              {/* 본인 영상일 때만 삭제 버튼 노출 */}
              {user && user.id === video.user_id && (
                <button 
                  onClick={() => handleDelete(video.id, video.user_id)} 
                  style={{ marginTop: '15px', background: 'none', border: 'none', color: '#444', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  게시물 삭제
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 5. 영상 재생 모달 */}
      {playingId && (
        <div 
          onClick={() => setPlayingId(null)} 
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}
        >
          <div style={{ width: '90%', maxWidth: '1000px', aspectRatio: '16/9' }} onClick={e => e.stopPropagation()}>
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${playingId}?autoplay=1`} frameBorder="0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
          </div>
        </div>
      )}
    </div>
  );
}