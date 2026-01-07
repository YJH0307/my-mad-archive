'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qgqdygeuxamtfscakqaf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncWR5Z2V1eGFtdGZzY2FrcWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTUxNzcsImV4cCI6MjA4MzM3MTE3N30.Z1rwozI8Z0EsJuOo7jCvxxazSA2gtCh3ri-v38OKnso';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [url, setUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [videoId, setVideoId] = useState('');
  const [sourceTag, setSourceTag] = useState('');
  const [musicTag, setMusicTag] = useState('');
  const [extraTags, setExtraTags] = useState(''); // 추가 태그 상태
  const [videoList, setVideoList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    fetchVideos();
    return () => subscription.unsubscribe();
  }, []);

  const fetchVideos = async () => {
    const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
    if (data) setVideoList(data);
  };

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert("실패: " + error.message); 
    else alert('가입 성공!');
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("로그인 실패: " + error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleIdentify = () => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[7].length === 11) ? match[7] : '';
    if (id) {
      setVideoId(id);
      setThumbnail(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);
    } else {
      alert('유튜브 주소를 확인해주세요!');
    }
  };

  const handleRegister = async () => {
    if (!user) return alert('로그인이 필요합니다!');
    const { error } = await supabase.from('videos').insert([{ 
      youtube_id: videoId, 
      source_tag: sourceTag, 
      music_tag: musicTag,
      extra_tags: extraTags, // 추가 태그 저장
      user_id: user.id 
    }]);
    if (error) alert(error.message); 
    else {
      alert('등록 성공!');
      setUrl(''); setThumbnail(''); setSourceTag(''); setMusicTag(''); setExtraTags('');
      fetchVideos();
    }
  };

  const handleDelete = async (id: number, ownerId: string) => {
    if (!user || user.id !== ownerId) return alert('본인만 삭제 가능!');
    if (confirm('정말 삭제하시겠습니까?')) {
      const { error } = await supabase.from('videos').delete().eq('id', id);
      if (!error) fetchVideos();
    }
  };

  // 쉼표로 구분된 태그들을 칩 형태로 보여주는 컴포넌트
  const TagChips = ({ tags, color }: { tags: string, color: string }) => {
    if (!tags) return null;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
        {tags.split(',').map((tag, i) => (
          <span key={i} style={{ 
            fontSize: '0.65rem', 
            padding: '2px 8px', 
            borderRadius: '10px', 
            backgroundColor: color + '22', 
            color: color,
            border: `1px solid ${color}44`
          }}>
            #{tag.trim()}
          </span>
        ))}
      </div>
    );
  };

  const filteredVideos = videoList.filter(v => 
    v.source_tag.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.music_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.extra_tags && v.extra_tags.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* 계정 관리 */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #333', zIndex: 10 }}>
        {user ? (
          <div>
            <div style={{ fontSize: '0.8rem', color: '#888' }}>{user.email}</div>
            <button onClick={handleLogout} style={{ marginTop: '10px', width: '100%', cursor: 'pointer' }}>로그아웃</button>
          </div>
        ) : (
          <div>
            <input placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: '5px', display: 'block', padding: '5px', backgroundColor: '#000', color: '#fff', border: '1px solid #444' }} />
            <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} style={{ marginBottom: '10px', display: 'block', padding: '5px', backgroundColor: '#000', color: '#fff', border: '1px solid #444' }} />
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={handleLogin} style={{ flex: 1, cursor: 'pointer' }}>로그인</button>
              <button onClick={handleSignUp} style={{ flex: 1, cursor: 'pointer' }}>가입</button>
            </div>
          </div>
        )}
      </div>

      <h1 style={{ fontSize: '2.5rem', color: '#ff0000', marginTop: '50px' }}>KR 음MAD ARCHIVE</h1>

      {/* 등록 UI */}
      {user && (
        <div style={{ margin: '40px 0', padding: '20px', backgroundColor: '#111', borderRadius: '15px', display: 'inline-block', border: '1px solid #222', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input type="text" placeholder="유튜브 링크" value={url} onChange={e => setUrl(e.target.value)} style={{ padding: '10px', width: '300px', backgroundColor: '#000', color: '#fff', border: '1px solid #444' }} />
            <button onClick={handleIdentify} style={{ padding: '10px', backgroundColor: '#ff0000', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>확인</button>
          </div>

          {thumbnail && (
            <div style={{ marginTop: '20px', width: '385px' }}>
              <img src={thumbnail} width="100%" style={{ borderRadius: '10px', marginBottom: '15px' }} />
              <label style={{ fontSize: '0.8rem', color: '#888' }}>소스 태그 (쉼표로 구분)</label>
              <input placeholder="예: 무야호, 거침없이하이킥" value={sourceTag} onChange={e => setSourceTag(e.target.value)} style={{ display: 'block', width: '100%', padding: '10px', margin: '5px 0 10px 0', backgroundColor: '#000', color: '#fff', border: '1px solid #444' }} />
              
              <label style={{ fontSize: '0.8rem', color: '#888' }}>원곡 태그 (쉼표로 구분)</label>
              <input placeholder="예: 밤양갱, 멜로디" value={musicTag} onChange={e => setMusicTag(e.target.value)} style={{ display: 'block', width: '100%', padding: '10px', margin: '5px 0 10px 0', backgroundColor: '#000', color: '#fff', border: '1px solid #444' }} />
              
              <label style={{ fontSize: '0.8rem', color: '#888' }}>기타 태그 (합작, 이벤트 등)</label>
              <input placeholder="예: 합작, 2024이벤트" value={extraTags} onChange={e => setExtraTags(e.target.value)} style={{ display: 'block', width: '100%', padding: '10px', margin: '5px 0 15px 0', backgroundColor: '#000', color: '#fff', border: '1px solid #444' }} />
              
              <button onClick={handleRegister} style={{ width: '100%', padding: '12px', backgroundColor: '#fff', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>등록하기</button>
            </div>
          )}
        </div>
      )}

      {/* 검색창 */}
      <div style={{ margin: '30px 0' }}>
        <input placeholder="소스, 원곡, 추가 태그로 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '15px', width: '500px', borderRadius: '25px', backgroundColor: '#111', color: '#fff', border: '1px solid #333', textAlign: 'center' }} />
      </div>

      {/* 리스트 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {filteredVideos.map((video) => (
          <div key={video.id} style={{ backgroundColor: '#111', borderRadius: '15px', overflow: 'hidden', border: '1px solid #222', transition: '0.3s' }}>
            <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} width="100%" onClick={() => setPlayingId(video.youtube_id)} style={{ cursor: 'pointer' }} />
            <div style={{ padding: '15px', textAlign: 'left' }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: '#ff0000', display: 'block' }}>SOURCES</span>
                <TagChips tags={video.source_tag} color="#ff0000" />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ fontSize: '0.7rem', color: '#0070f3', display: 'block' }}>MUSIC</span>
                <TagChips tags={video.music_tag} color="#0070f3" />
              </div>
              {video.extra_tags && (
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#00ff88', display: 'block' }}>EXTRA</span>
                  <TagChips tags={video.extra_tags} color="#00ff88" />
                </div>
              )}
              {user && user.id === video.user_id && (
                <button onClick={() => handleDelete(video.id, video.user_id)} style={{ marginTop: '10px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem' }}>삭제</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 재생 창 */}
      {playingId && (
        <div onClick={() => setPlayingId(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ width: '80%', maxWidth: '800px', aspectRatio: '16/9' }} onClick={e => e.stopPropagation()}>
            <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${playingId}?autoplay=1`} frameBorder="0" allowFullScreen></iframe>
          </div>
        </div>
      )}
    </div>
  );
}