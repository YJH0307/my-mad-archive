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

  // 기존 데이터 소급 적용 함수 (Backfill)
  const handleBackfill = async () => {
    if (!user) return alert('로그인이 필요합니다.');
    
    // 제목이나 채널명이 비어있는 영상들만 필터링해서 가져옴
    const { data: targets } = await supabase
      .from('videos')
      .select('*')
      .or('title.is.null,user_email.is.null');

    if (!targets || targets.length === 0) {
      return alert('소급 적용할 영상이 없습니다. 이미 모두 업데이트된 것 같습니다!');
    }

    if (!confirm(`${targets.length}개의 영상 정보를 유튜브에서 가져와 업데이트할까요?`)) return;

    for (const video of targets) {
      try {
        const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${video.youtube_id}`);
        const data = await res.json();
        
        await supabase
          .from('videos')
          .update({
            title: data.title || '제목 없음',
            user_email: data.author_name || '알 수 없는 채널'
          })
          .eq('id', video.id);
      } catch (err) {
        console.error(`실패: ${video.youtube_id}`, err);
      }
    }

    alert('모든 영상 정보가 업데이트되었습니다!');
    fetchVideos();
  };

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
        setTitle(data.title || '');
        setUploader(data.author_name || '');
      } catch (err) {
        alert('유튜브 정보를 가져오는데 실패했습니다.');
      }
    } else { alert('올바른 유튜브 링크를 입력해주세요!'); }
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
      alert('등록 성공!');
      setUrl(''); setTitle(''); setUploader(''); setThumbnail(''); setSourceTag(''); setMusicTag(''); setExtraTags('');
      fetchVideos();
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchTerm(tag.trim());
    window.scrollTo({ top: 450, behavior: 'smooth' });
  };

  const filteredVideos: any[] = videoList.filter((v: any) => 
    (v.title + v.source_tag + v.music_tag + (v.extra_tags || '') + (v.user_email || '')).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* 로그인 바 */}
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
            <button onClick={() => supabase.auth.signInWithPassword({email, password})} style={{ ...btnStyle, padding: '8px 15px', backgroundColor: '#444', color: '#fff' }}>로그인</button>
            <button onClick={() => supabase.auth.signUp({email, password})} style={{ ...btnStyle, padding: '8px 15px', backgroundColor: '#ff0000', color: '#fff' }}>가입</button>
          </div>
        )}
      </div>

      <h1 style={{ fontSize: '3rem', color: '#ff0000', marginTop: '80px', fontWeight: '900', letterSpacing: '-2px' }}>KR MAD ARCHIVE</h1>
      
      {/* 소급 적용 버튼 (작업 완료 후 삭제 가능) */}
      {user && (
        <button onClick={handleBackfill} style={{ ...btnStyle, backgroundColor: '#222', color: '#00ff88', marginBottom: '20px', border: '1px solid #00ff8844' }}>
          ✨ 기존 영상 정보 소급 적용하기 (클릭)
        </button>
      )}

      {/* 등록 창 */}
      {user && (
        <div style={{ margin: '20px auto 40px auto', padding: '30px', backgroundColor: '#111', borderRadius: '40px', maxWidth: '550px', border: '1px solid #222', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <input placeholder="유튜브 링크 입력" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
            <button onClick={handleIdentify} style={{ ...btnStyle, backgroundColor: '#ff0000', color: '#fff', whiteSpace: 'nowrap' }}>확인</button>
          </div>
          {thumbnail && (
            <div>
              <img src={thumbnail} width="100%" style={{ borderRadius: '30px', marginBottom: '15px', border: '1px solid #333' }} />
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="영상 제목 (자동)" style={{ ...inputStyle, marginBottom: '10px' }} />
              <input value={uploader} onChange={e => setUploader(e.target.value)} placeholder="채널명 (자동)" style={{ ...inputStyle, marginBottom: '10px' }} />
              <input placeholder="소스 태그 (쉼표 구분)" value={sourceTag} onChange={e => setSourceTag(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
              <input placeholder="원곡 태그 (쉼표 구분)" value={musicTag} onChange={e => setMusicTag(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
              <input placeholder="추가 태그 (쉼표 구분)" value={extraTags} onChange={e => setExtraTags(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }} />
              <button onClick={handleRegister} style={{ ...btnStyle, width: '100%', backgroundColor: '#fff', color: '#000', fontSize: '1.1rem' }}>아카이브 등록</button>
            </div>
          )}
        </div>
      )}

      {/* 검색창 */}
      <div style={{ margin: '50px 0' }}>
        <input placeholder="제목, 채널, 태그 통합 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, width: '85%', maxWidth: '750px', height: '60px', textAlign: 'center', borderRadius: '50px', fontSize: '1.2rem' }} />
      </div>

      {/* 목록 리스트 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '35px', padding: '0 20px 100px 20px' }}>
        {filteredVideos.map((video: any) => (
          <div key={video.id} style={{ backgroundColor: '#111', borderRadius: '40px', overflow: 'hidden', border: '1px solid #222', textAlign: 'left' }}>
            <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} width="100%" onClick={() => setPlayingId(video.youtube_id)} style={{ cursor: 'pointer' }} />
            <div style={{ padding: '25px' }}>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '1.05rem', lineHeight: '1.4' }}>{video.title || '제목 불러오는 중...'}</h3>
              <p onClick={() => handleTagClick(video.user_email)} style={{ fontSize: '0.8rem', color: '#888', marginBottom: '15px', cursor: 'pointer' }}>📺 {video.user_email || '채널 정보 없음'}</p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {video.source_tag?.split(',').map((t:any, i:any) => <span key={i} onClick={() => handleTagClick(t)} style={{ cursor: 'pointer', padding: '4px 10px', borderRadius: '15px', border: '1px solid #ff000066', color: '#ff0000', fontSize: '0.7rem' }}>#{t.trim()}</span>)}
                {video.music_tag?.split(',').map((t:any, i:any) => <span key={i} onClick={() => handleTagClick(t)} style={{ cursor: 'pointer', padding: '4px 10px', borderRadius: '15px', border: '1px solid #0070f366', color: '#0070f3', fontSize: '0.7rem' }}>#{t.trim()}</span>)}
                {video.extra_tags?.split(',').map((t:any, i:any) => <span key={i} onClick={() => handleTagClick(t)} style={{ cursor: 'pointer', padding: '4px 10px', borderRadius: '15px', border: '1px solid #00ff8866', color: '#00ff88', fontSize: '0.7rem' }}>#{t.trim()}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 재생 창 */}
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