'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. Supabase 연결 설정
const SUPABASE_URL = 'https://qgqdygeuxamtfscakqaf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncWR5Z2V1eGFtdGZzY2FrcWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTUxNzcsImV4cCI6MjA4MzM3MTE3N30.Z1rwozI8Z0EsJuOo7jCvxxazSA2gtCh3ri-v38OKnso';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState(''); 
  const [uploader, setUploader] = useState(''); 
  const [thumbnail, setThumbnail] = useState('');
  const [videoId, setVideoId] = useState('');
  const [sourceTag, setSourceTag] = useState('');
  const [musicTag, setMusicTag] = useState('');
  const [extraTags, setExtraTags] = useState('');
  const [videoList, setVideoList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSource, setEditSource] = useState('');
  const [editMusic, setEditMusic] = useState('');
  const [editExtra, setEditExtra] = useState('');

  // 디자인 설정: 모서리 40px로 아주 뭉툭하게 통일
  const ROUNDED = '40px'; 
  const inputStyle: React.CSSProperties = { padding: '15px 25px', borderRadius: ROUNDED, backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333', outline: 'none', fontSize: '1rem', width: '100%', boxSizing: 'border-box' };
  const btnStyle: React.CSSProperties = { padding: '12px 25px', borderRadius: ROUNDED, cursor: 'pointer', border: 'none', fontWeight: 'bold', fontSize: '0.9rem' };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    const { data } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
    if (data) setVideoList(data);
  };

  // 유튜브 정보 자동 가져오기 함수 (제목, 채널명)
  const handleIdentify = async () => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[7].length === 11) ? match[7] : '';
    
    if (id) {
      setVideoId(id);
      setThumbnail(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);
      try {
        const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
        const data = await res.json();
        setTitle(data.title || '제목 없음');
        setUploader(data.author_name || '알 수 없는 채널');
      } catch (err) {
        alert('유튜브 정보를 가져오는데 실패했습니다.');
      }
    } else { alert('올바른 유튜브 링크를 입력해주세요!'); }
  };

  // 로그인 및 회원가입 함수 (사진의 빨간 줄 해결용)
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("로그인 실패: " + error.message);
  };

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert("가입 실패: " + error.message); 
    else alert('가입 성공! 이제 로그인 해주세요.');
  };

  const handleRegister = async () => {
    if (!user) return alert('로그인이 필요합니다!');
    const { error } = await supabase.from('videos').insert([{ 
      youtube_id: videoId, title, user_email: uploader, 
      source_tag: sourceTag, music_tag: musicTag, extra_tags: extraTags, user_id: user.id
    }]);

    if (error) {
      if (error.code === '23505') alert('이미 등록된 영상입니다!');
      else alert("저장 에러: " + error.message);
    } else {
      alert('성공적으로 등록되었습니다!');
      setUrl(''); setTitle(''); setUploader(''); setThumbnail(''); setSourceTag(''); setMusicTag(''); setExtraTags('');
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
    else { alert('반영되었습니다!'); setEditingId(null); fetchVideos(); }
  };

  const handleTagClick = (tag: string) => {
    setSearchTerm(tag.trim());
    window.scrollTo({ top: 500, behavior: 'smooth' });
  };

  const filteredVideos: any[] = videoList.filter((v: any) => 
    (v.title + v.source_tag + v.music_tag + (v.extra_tags || '') + (v.user_email || '')).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* 1. 로그인 영역 (우측 상단) */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: '#161616', padding: '15px', borderRadius: '25px', border: '1px solid #333', zIndex: 10 }}>
        {user ? (
          <div>
            <div style={{ fontSize: '0.75rem', color: '#888' }}>{user.email}</div>
            <button onClick={() => supabase.auth.signOut()} style={{ ...btnStyle, marginTop: '8px', padding: '5px 15px', backgroundColor: '#333', color: '#fff', width: '100%' }}>로그아웃</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '5px' }}>
            <input placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} style={{ ...inputStyle, padding: '8px 15px', width: '140px', borderRadius: '15px' }} />
            <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, padding: '8px 15px', width: '140px', borderRadius: '15px' }} />
            <button onClick={handleLogin} style={{ ...btnStyle, padding: '8px 15px', backgroundColor: '#444', color: '#fff' }}>로그인</button>
            <button onClick={handleSignUp} style={{ ...btnStyle, padding: '8px 15px', backgroundColor: '#ff0000', color: '#fff' }}>가입</button>
          </div>
        )}
      </div>

      <h1 style={{ fontSize: '3rem', color: '#ff0000', marginTop: '80px', fontWeight: '900', letterSpacing: '-2px' }}>KR MAD ARCHIVE</h1>
      
      {/* 2. 등록 창 (아주 뭉툭한 모서리) */}
      {user && (
        <div style={{ margin: '40px auto', padding: '30px', backgroundColor: '#111', borderRadius: '40px', maxWidth: '550px', border: '1px solid #222', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input placeholder="유튜브 링크 입력" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
            <button onClick={handleIdentify} style={{ ...btnStyle, backgroundColor: '#ff0000', color: '#fff', whiteSpace: 'nowrap' }}>확인</button>
          </div>
          {thumbnail && (
            <div>
              <img src={thumbnail} width="100%" style={{ borderRadius: '30px', marginBottom: '15px', border: '1px solid #333' }} />
              <label style={{ fontSize: '0.8rem', color: '#ff0000', marginLeft: '15px' }}>가져온 제목</label>
              <input value={title} onChange={e => setTitle(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
              <label style={{ fontSize: '0.8rem', color: '#ff0000', marginLeft: '15px' }}>유튜브 채널명</label>
              <input value={uploader} onChange={e => setUploader(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
              <input placeholder="소스 (쉼표로 구분)" value={sourceTag} onChange={e => setSourceTag(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
              <input placeholder="원곡 (쉼표로 구분)" value={musicTag} onChange={e => setMusicTag(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
              <input placeholder="추가 태그 (쉼표로 구분)" value={extraTags} onChange={e => setExtraTags(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }} />
              <button onClick={handleRegister} style={{ ...btnStyle, width: '100%', backgroundColor: '#fff', color: '#000', fontSize: '1.1rem' }}>아카이브 등록</button>
            </div>
          )}
        </div>
      )}

      {/* 3. 검색창 (알약 모양) */}
      <div id="search-area" style={{ margin: '50px 0' }}>
        <input placeholder="제목, 채널, 태그 통합 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, width: '85%', maxWidth: '750px', height: '60px', textAlign: 'center', borderRadius: '50px', fontSize: '1.2rem' }} />
      </div>

      {/* 4. 목록 리스트 (뭉툭한 카드) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '35px', padding: '0 20px 100px 20px' }}>
        {filteredVideos.map((video: any) => (
          <div key={video.id} style={{ backgroundColor: '#111', borderRadius: '40px', overflow: 'hidden', border: '1px solid #222', textAlign: 'left' }}>
            <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} width="100%" onClick={() => setPlayingId(video.youtube_id)} style={{ cursor: 'pointer' }} />
            <div style={{ padding: '25px' }}>
              {editingId === video.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input value={editSource} onChange={e => setEditSource(e.target.value)} style={{ ...inputStyle, borderRadius: '15px' }} />
                  <input value={editMusic} onChange={e => setEditMusic(e.target.value)} style={{ ...inputStyle, borderRadius: '15px' }} />
                  <input value={editExtra} onChange={e => setEditExtra(e.target.value)} style={{ ...inputStyle, borderRadius: '15px' }} />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleUpdateTags(video)} style={{ ...btnStyle, flex: 1, backgroundColor: '#00ff88', color: '#000' }}>저장</button>
                    <button onClick={() => setEditingId(null)} style={{ ...btnStyle, flex: 1, backgroundColor: '#444', color: '#fff' }}>취소</button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '1.05rem', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{video.title}</h3>
                  <p onClick={() => handleTagClick(video.user_email)} style={{ fontSize: '0.8rem', color: '#888', marginBottom: '15px', cursor: 'pointer' }}>📺 {video.user_email}</p>
                  
                  {/* 모든 태그 한 줄 정렬 */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {video.source_tag.split(',').map((t:any, i:any) => <span key={i} onClick={() => handleTagClick(t)} style={{ cursor: 'pointer', padding: '4px 12px', borderRadius: '20px', border: '1px solid #ff000066', color: '#ff0000', fontSize: '0.7rem' }}>#{t.trim()}</span>)}
                    {video.music_tag.split(',').map((t:any, i:any) => <span key={i} onClick={() => handleTagClick(t)} style={{ cursor: 'pointer', padding: '4px 12px', borderRadius: '20px', border: '1px solid #0070f366', color: '#0070f3', fontSize: '0.7rem' }}>#{t.trim()}</span>)}
                    {video.extra_tags?.split(',').map((t:any, i:any) => <span key={i} onClick={() => handleTagClick(t)} style={{ cursor: 'pointer', padding: '4px 12px', borderRadius: '20px', border: '1px solid #00ff8866', color: '#00ff88', fontSize: '0.7rem' }}>#{t.trim()}</span>)}
                  </div>

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

      {/* 5. 재생 모달 (뭉툭한 플레이어) */}
      {playingId && (
        <div onClick={() => setPlayingId(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ width: '85%', maxWidth: '1000px', aspectRatio: '16/9', position: 'relative' }} onClick={e => e.stopPropagation()}>
             <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${playingId}?autoplay=1`} frameBorder="0" allowFullScreen style={{ borderRadius: '40px' }}></iframe>
          </div>
        </div>
      )}
    </div>
  );
}