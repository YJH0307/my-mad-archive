'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. Supabase 설정
const SUPABASE_URL = 'https://qgqdygeuxamtfscakqaf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncWR5Z2V1eGFtdGZzY2FrcWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTUxNzcsImV4cCI6MjA4MzM3MTE3N30.Z1rwozI8Z0EsJuOo7jCvxxazSA2gtCh3ri-v38OKnso';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Home() {
  // 상태 관리 - 타입을 any[]로 명시하여 에러 해결
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [videoId, setVideoId] = useState('');
  const [sourceTag, setSourceTag] = useState('');
  const [musicTag, setMusicTag] = useState('');
  const [extraTags, setExtraTags] = useState('');
  const [videoList, setVideoList] = useState<any[]>([]); // 타입 에러 방지용 any[]
  const [searchTerm, setSearchTerm] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSource, setEditSource] = useState('');
  const [editMusic, setEditMusic] = useState('');
  const [editExtra, setEditExtra] = useState('');

  // 공통 스타일 설정 (모서리 30px로 아주 뭉툭하게)
  const ROUNDED_PX = '30px';
  const ROUNDED_SMALL = '15px';
  const inputStyle: React.CSSProperties = { 
    padding: '12px 20px', 
    borderRadius: ROUNDED_PX, 
    backgroundColor: '#1a1a1a', 
    color: '#fff', 
    border: '1px solid #333', 
    outline: 'none', 
    fontSize: '0.9rem' 
  };
  const btnStyle: React.CSSProperties = { 
    padding: '12px 24px', 
    borderRadius: ROUNDED_PX, 
    cursor: 'pointer', 
    border: 'none', 
    fontWeight: 'bold', 
    fontSize: '0.9rem',
    transition: '0.2s'
  };

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
    else alert('가입 성공! 이제 로그인 해주세요.');
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("로그인 실패: " + error.message);
  };

  const handleIdentify = () => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[7].length === 11) ? match[7] : '';
    if (id) {
      setVideoId(id);
      setThumbnail(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);
    } else { alert('유튜브 링크를 확인해주세요!'); }
  };

  const handleRegister = async () => {
    if (!user) return alert('로그인이 필요합니다!');
    const { error } = await supabase.from('videos').insert([{ 
      youtube_id: videoId, source_tag: sourceTag, music_tag: musicTag, extra_tags: extraTags, user_id: user.id 
    }]);

    if (error) {
      if (error.code === '23505') alert('이미 등록된 영상입니다!');
      else alert("저장 에러: " + error.message);
    } else {
      alert('성공! 등록되었습니다.');
      setUrl(''); setThumbnail(''); setSourceTag(''); setMusicTag(''); setExtraTags('');
      fetchVideos();
    }
  };

  const handleUpdateTags = async (video: any) => {
    const isOwner = user.id === video.user_id;
    let finalSource = editSource, finalMusic = editMusic, finalExtra = editExtra;

    if (!isOwner) {
      const combine = (old: string, add: string) => {
        const oldSet = new Set(old.split(',').map(s => s.trim()).filter(Boolean));
        add.split(',').map(s => s.trim()).filter(Boolean).forEach(tag => oldSet.add(tag));
        return Array.from(oldSet).join(', ');
      };
      finalSource = combine(video.source_tag, editSource);
      finalMusic = combine(video.music_tag, editMusic);
      finalExtra = combine(video.extra_tags || '', editExtra);
    }

    const { error } = await supabase.from('videos').update({ source_tag: finalSource, music_tag: finalMusic, extra_tags: finalExtra }).eq('id', video.id);
    if (error) alert(error.message);
    else { alert(isOwner ? '수정 완료!' : '기여 완료!'); setEditingId(null); fetchVideos(); }
  };

  const TagChips = ({ tags, color }: { tags: string, color: string }) => {
    if (!tags) return null;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
        {tags.split(',').map((tag: string, i: number) => (
          <span key={i} style={{ fontSize: '0.7rem', padding: '4px 12px', borderRadius: '20px', backgroundColor: color + '22', color: color, border: `1px solid ${color}44` }}>
            #{tag.trim()}
          </span>
        ))}
      </div>
    );
  };

  // 3. 필터링 로직 - 타입 에러 해결을 위해 명시적 타입 지정
  const filteredVideos: any[] = videoList.filter((v: any) => {
    const combinedTags = (v.source_tag || "") + (v.music_tag || "") + (v.extra_tags || "");
    return combinedTags.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* 로그인 영역 - 모서리 뭉툭하게 */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: '#111', padding: '15px', borderRadius: '20px', border: '1px solid #333', zIndex: 10 }}>
        {user ? (
          <div>
            <div style={{ fontSize: '0.75rem', marginBottom: '8px', color: '#aaa' }}>{user.email}</div>
            <button onClick={() => supabase.auth.signOut()} style={{ ...btnStyle, padding: '8px 15px', width: '100%', fontSize: '0.8rem', backgroundColor: '#333', color: '#fff' }}>로그아웃</button>
          </div>
        ) : (
          <div>
            <input placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} style={{ ...inputStyle, borderRadius: ROUNDED_SMALL, marginBottom: '5px', width: '200px', display: 'block' }} />
            <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, borderRadius: ROUNDED_SMALL, marginBottom: '10px', width: '200px', display: 'block' }} />
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={handleLogin} style={{ ...btnStyle, padding: '8px', flex: 1, backgroundColor: '#444', color: '#fff' }}>로그인</button>
              <button onClick={handleSignUp} style={{ ...btnStyle, padding: '8px', flex: 1, backgroundColor: '#ff0000', color: '#fff' }}>가입</button>
            </div>
          </div>
        )}
      </div>

      <h1 style={{ fontSize: '2.5rem', color: '#ff0000', marginTop: '80px', fontWeight: '900' }}>KR 음MAD ARCHIVE</h1>

      {/* 등록 UI - 입력창과 버튼 모두 뭉툭하게 */}
      {user && (
        <div style={{ margin: '40px auto', padding: '30px', backgroundColor: '#111', borderRadius: ROUNDED_PX, maxWidth: '520px', border: '1px solid #222', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input placeholder="유튜브 링크" value={url} onChange={e => setUrl(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={handleIdentify} style={{ ...btnStyle, backgroundColor: '#ff0000', color: '#fff' }}>영상 확인</button>
          </div>
          {thumbnail && (
            <div>
              <img src={thumbnail} width="100%" style={{ borderRadius: ROUNDED_PX, border: '1px solid #333', marginBottom: '15px' }} />
              <input placeholder="소스 (쉼표 구분)" value={sourceTag} onChange={e => setSourceTag(e.target.value)} style={{ ...inputStyle, display: 'block', width: '100%', marginBottom: '10px', boxSizing: 'border-box' }} />
              <input placeholder="원곡 (쉼표 구분)" value={musicTag} onChange={e => setMusicTag(e.target.value)} style={{ ...inputStyle, display: 'block', width: '100%', marginBottom: '10px', boxSizing: 'border-box' }} />
              <input placeholder="추가 태그 (쉼표 구분)" value={extraTags} onChange={e => setExtraTags(e.target.value)} style={{ ...inputStyle, display: 'block', width: '100%', marginBottom: '20px', boxSizing: 'border-box' }} />
              <button onClick={handleRegister} style={{ ...btnStyle, width: '100%', backgroundColor: '#fff', color: '#000' }}>아카이브 등록</button>
            </div>
          )}
        </div>
      )}

      {/* 검색창 - 아주 뭉툭하게 */}
      <div style={{ margin: '40px 0' }}>
        <input placeholder="소스, 원곡, 태그 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, width: '80%', maxWidth: '600px', height: '50px', fontSize: '1.1rem', textAlign: 'center', borderRadius: '50px' }} />
      </div>

      {/* 목록 리스트 - 카드와 버튼 모두 뭉툭하게 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px', padding: '0 20px 100px 20px' }}>
        {filteredVideos.map((video: any) => (
          <div key={video.id} style={{ backgroundColor: '#111', borderRadius: ROUNDED_PX, overflow: 'hidden', border: '1px solid #222' }}>
            <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} width="100%" onClick={() => setPlayingId(video.youtube_id)} style={{ cursor: 'pointer' }} />
            <div style={{ padding: '20px' }}>
              {editingId === video.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input value={editSource} onChange={e => setEditSource(e.target.value)} style={{ ...inputStyle, borderRadius: ROUNDED_SMALL }} />
                  <input value={editMusic} onChange={e => setEditMusic(e.target.value)} style={{ ...inputStyle, borderRadius: ROUNDED_SMALL }} />
                  <input value={editExtra} onChange={e => setEditExtra(e.target.value)} style={{ ...inputStyle, borderRadius: ROUNDED_SMALL }} />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleUpdateTags(video)} style={{ ...btnStyle, flex: 1, backgroundColor: '#00ff88', color: '#000' }}>저장</button>
                    <button onClick={() => setEditingId(null)} style={{ ...btnStyle, flex: 1, backgroundColor: '#444', color: '#fff' }}>취소</button>
                  </div>
                </div>
              ) : (
                <>
                  <TagChips tags={video.source_tag} color="#ff0000" />
                  <TagChips tags={video.music_tag} color="#0070f3" />
                  <TagChips tags={video.extra_tags} color="#00ff88" />
                  <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => {
                      setEditingId(video.id);
                      const isOwner = user?.id === video.user_id;
                      setEditSource(isOwner ? video.source_tag : '');
                      setEditMusic(isOwner ? video.music_tag : '');
                      setEditExtra(isOwner ? video.extra_tags || '' : '');
                    }} style={{ ...btnStyle, padding: '8px 20px', fontSize: '0.8rem', backgroundColor: '#222', color: '#fff' }}>
                      {user?.id === video.user_id ? '정보 수정' : '태그 기여'}
                    </button>
                    {user?.id === video.user_id && (
                      <button onClick={() => {if(confirm('삭제할까요?')) supabase.from('videos').delete().eq('id', video.id).then(fetchVideos)}} style={{ color: '#ff4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>삭제</button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 재생 창 */}
      {playingId && (
        <div onClick={() => setPlayingId(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ width: '85%', maxWidth: '900px', aspectRatio: '16/9', position: 'relative' }} onClick={e => e.stopPropagation()}>
             <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${playingId}?autoplay=1`} frameBorder="0" allowFullScreen style={{ borderRadius: ROUNDED_PX }}></iframe>
          </div>
        </div>
      )}
    </div>
  );
}