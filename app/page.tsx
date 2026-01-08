'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qgqdygeuxamtfscakqaf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncWR5Z2V1eGFtdGZzY2FrcWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTUxNzcsImV4cCI6MjA4MzM3MTE3N30.Z1rwozI8Z0EsJuOo7jCvxxazSA2gtCh3ri-v38OKnso';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const YOUTUBE_API_KEY = 'AIzaSyBRXil-pM91p2G8jzAhMvuV7pteiJ3lbRg';

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

  const [bulkQueue, setBulkQueue] = useState<any[]>([]);
  const [bulkIndex, setBulkIndex] = useState(0);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);

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

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("로그인 실패: " + error.message);
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
        setTitle(data.title || ''); setUploader(data.author_name || '');
      } catch (err) { console.error(err); }
    } else { alert('URL을 확인해주세요!'); }
  };

  const fetchPlaylistVideos = async (token?: string) => {
    const playlistMatch = url.match(/[&?]list=([^&]+)/);
    const pId = playlistMatch ? playlistMatch[1] : currentPlaylistId;
    if (!pId) return alert('재생목록 ID를 찾을 수 없습니다.');
    setCurrentPlaylistId(pId);
    let apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${pId}&key=${YOUTUBE_API_KEY}`;
    if (token) apiUrl += `&pageToken=${token}`;
    try {
      const res = await fetch(apiUrl);
      const data = await res.json();
      const extracted = data.items.map((item: any) => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        uploader: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle
      })).filter((v: any) => !videoList.some(reg => reg.youtube_id === v.id));
      setNextPageToken(data.nextPageToken || null);
      setBulkQueue(extracted); setBulkIndex(0); setIsBulkMode(true);
      if(extracted.length > 0) loadBulkVideo(extracted[0]);
    } catch (e) { alert('API 에러'); }
  };

  const loadBulkVideo = (video: any) => {
    setVideoId(video.id); setTitle(video.title); setUploader(video.uploader);
    setThumbnail(`https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`);
    setSourceTag(''); setMusicTag(''); setExtraTags('');
  };

  const skipToNext = () => {
    const nextIndex = bulkIndex + 1;
    if (nextIndex < bulkQueue.length) {
      setBulkIndex(nextIndex); loadBulkVideo(bulkQueue[nextIndex]);
    } else if (nextPageToken) {
      if (confirm('다음 페이지를 불러올까요?')) fetchPlaylistVideos(nextPageToken);
      else finishBulk();
    } else { alert('작업 완료!'); finishBulk(); }
  };

  const finishBulk = () => {
    setIsBulkMode(false); setBulkQueue([]); setVideoId(''); setNextPageToken(null); setCurrentPlaylistId(null); fetchVideos();
  };

  const handleRegister = async () => {
    if (!user) return alert('로그인 필요!');
    const { error } = await supabase.from('videos').insert([{ 
      youtube_id: videoId, title, user_email: uploader, 
      source_tag: sourceTag, music_tag: musicTag, extra_tags: extraTags, user_id: user.id
    }]);

    if (error) {
      if (error.code === '23505') alert('이미 등록된 영상입니다!');
      else alert(error.message);
    } else {
      if (isBulkMode) skipToNext(); 
      else { alert('등록 성공!'); setVideoId(''); setUrl(''); fetchVideos(); }
    }
  };

  const handleUpdateTags = async (video: any) => {
    if (!user) return alert('로그인이 필요합니다!');
    const { error } = await supabase.from('videos').update({ 
      source_tag: editSource, music_tag: editMusic, extra_tags: editExtra 
    }).eq('id', video.id);

    if (error) alert(error.message); 
    else { 
      alert(user.id === video.user_id ? '수정 완료!' : '기여 감사합니다!'); 
      setEditingId(null); fetchVideos(); 
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchTerm(tag.trim());
    window.scrollTo({ top: 500, behavior: 'smooth' });
  };

  const filteredVideos = videoList.filter((v: any) => {
    const normalizedSearch = searchTerm.replace(/\s+/g, '').toLowerCase();
    if (!normalizedSearch) return true;
    const check = (val: string) => (val || "").replace(/\s+/g, '').toLowerCase().includes(normalizedSearch);
    return check(v.title) || check(v.user_email) || check(v.source_tag) || check(v.music_tag) || check(v.extra_tags);
  });

  return (
    <div style={{ 
      margin: 0, 
      padding: '0 0 100px 0', // 최상단 마진 제거, 하단 여백만 유지
      textAlign: 'center', 
      backgroundColor: '#0a0a0a', 
      color: '#fff', 
      minHeight: '100vh', 
      width: '100%', 
      boxSizing: 'border-box',
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      
      {/* 1. 로그인 바 (우측 상단 고정) */}
      <div style={{ alignSelf: 'flex-end', margin: '20px 20px 0 0', backgroundColor: '#161616', padding: '15px', borderRadius: '25px', border: '1px solid #333', zIndex: 10 }}>
        {user ? (
          <div>
            <div style={{ fontSize: '0.75rem', color: '#888' }}>{user.email}</div>
            <button onClick={() => supabase.auth.signOut()} style={{ ...btnStyle, marginTop: '5px', padding: '5px 10px', fontSize: '0.7rem', backgroundColor: '#333', color: '#fff' }}>로그아웃</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '5px' }}>
            <input placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} style={{ ...inputStyle, width: '120px', padding: '8px', borderRadius: '15px' }} />
            <input type="password" placeholder="비번" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, width: '120px', padding: '8px', borderRadius: '15px' }} />
            <button onClick={handleLogin} style={{ ...btnStyle, padding: '8px 12px', backgroundColor: '#444', color: '#fff' }}>로그인</button>
          </div>
        )}
      </div>

      {/* 2. 메인 로고 영역 */}
      <div style={{ marginTop: '40px', marginBottom: '20px', cursor: 'pointer' }} onClick={() => window.location.reload()}>
         {/* public/favicon.png를 로고로 활용하거나 텍스트 사용 */}
         <img src="/favicon.png" alt="Logo" style={{ width: '80px', height: '80px', marginBottom: '10px' }} />
         <h1 style={{ fontSize: '3.5rem', color: '#ff0000', fontWeight: '900', letterSpacing: '-2px', margin: 0 }}>KR 음MAD TAG</h1>
         <p style={{ color: '#888', marginTop: '5px' }}>대한민국 음MAD 영상 태그 저장소</p>
      </div>
      
      {isBulkMode && (
        <div style={{ backgroundColor: '#ff000022', padding: '15px', borderRadius: '30px', border: '1px solid #ff0000', margin: '20px 0', display: 'inline-block' }}>
          🚀 <b>연속 등록 모드:</b> {bulkIndex + 1} / {bulkQueue.length}
          <button onClick={skipToNext} style={{ marginLeft: '10px', cursor: 'pointer', background: 'none', border: '1px solid #fff', color: '#fff', borderRadius: '10px' }}>스킵</button>
        </div>
      )}

      {/* 3. 등록 섹션 */}
      {user && (
        <div style={{ margin: '30px auto', padding: '30px', backgroundColor: '#111', borderRadius: '40px', width: '90%', maxWidth: '550px', border: '1px solid #222', textAlign: 'left' }}>
          {!isBulkMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input placeholder="유튜브 영상 또는 재생목록 URL" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleIdentify} style={{ ...btnStyle, flex: 1, backgroundColor: '#333', color: '#fff' }}>단일 영상 확인</button>
                <button onClick={() => fetchPlaylistVideos()} style={{ ...btnStyle, flex: 1, backgroundColor: '#ff0000', color: '#fff' }}>재생목록 추출</button>
              </div>
            </div>
          ) : null}

          {videoId && (
            <div style={{ marginTop: '20px' }}>
              <img src={thumbnail} width="100%" style={{ borderRadius: '30px', border: '1px solid #333' }} />
              <div style={{ margin: '15px 0', fontSize: '0.9rem' }}><b>제목:</b> {title}<br/><b>채널:</b> {uploader}</div>
              <input placeholder="소스 태그 (예: 블루아카이브, 몰루)" value={sourceTag} onChange={e => setSourceTag(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
              <input placeholder="원곡 태그 (예: Unwelcome School)" value={musicTag} onChange={e => setMusicTag(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
              <input placeholder="기타 태그" value={extraTags} onChange={e => setExtraTags(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }} />
              <button onClick={handleRegister} style={{ ...btnStyle, width: '100%', backgroundColor: '#fff', color: '#000', fontSize: '1.1rem' }}>등록 및 저장</button>
            </div>
          )}
        </div>
      )}

      {/* 4. 검색창 */}
      <div style={{ margin: '40px 0', width: '90%', maxWidth: '750px' }}>
        <input 
          placeholder="제목, 채널명, 태그 검색 (띄어쓰기 무시)" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={{ ...inputStyle, height: '60px', textAlign: 'center', borderRadius: '50px', fontSize: '1.2rem', border: '2px solid #333' }} 
        />
      </div>
      
      {/* 5. 비디오 그리드 리스트 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px', width: '100%', padding: '0 20px', maxWidth: '1400px', boxSizing: 'border-box' }}>
        {filteredVideos.map((video: any) => (
          <div key={video.id} style={{ backgroundColor: '#111', borderRadius: '40px', border: '1px solid #222', textAlign: 'left', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
               <img 
                src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} 
                onClick={() => setPlayingId(video.youtube_id)} 
               />
            </div>
            <div style={{ padding: '25px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              {editingId === video.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input value={editSource} onChange={e => setEditSource(e.target.value)} placeholder="소스 태그 수정" style={{ ...inputStyle, borderRadius: '15px', padding: '10px' }} />
                  <input value={editMusic} onChange={e => setEditMusic(e.target.value)} placeholder="원곡 태그 수정" style={{ ...inputStyle, borderRadius: '15px', padding: '10px' }} />
                  <input value={editExtra} onChange={e => setEditExtra(e.target.value)} placeholder="기타 태그 수정" style={{ ...inputStyle, borderRadius: '15px', padding: '10px' }} />
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => handleUpdateTags(video)} style={{ ...btnStyle, flex: 1, backgroundColor: '#00ff88', color: '#000' }}>저장</button>
                    <button onClick={() => setEditingId(null)} style={{ ...btnStyle, flex: 1, backgroundColor: '#333' }}>취소</button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', minHeight: '2.8rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{video.title}</h3>
                  <p onClick={() => handleTagClick(video.user_email)} style={{ fontSize: '0.85rem', color: '#888', marginBottom: '18px', cursor: 'pointer' }}>📺 {video.user_email}</p>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
                    {video.source_tag?.split(',').map((t:any, i:any) => <span key={i} onClick={() => handleTagClick(t)} style={{ cursor: 'pointer', padding: '5px 12px', borderRadius: '20px', border: '1px solid #ff000066', color: '#ff0000', fontSize: '0.75rem' }}>#{t.trim()}</span>)}
                    {video.music_tag?.split(',').map((t:any, i:any) => <span key={i} onClick={() => handleTagClick(t)} style={{ cursor: 'pointer', padding: '5px 12px', borderRadius: '20px', border: '1px solid #0070f366', color: '#0070f3', fontSize: '0.75rem' }}>#{t.trim()}</span>)}
                    {video.extra_tags?.split(',').map((t:any, i:any) => <span key={i} onClick={() => handleTagClick(t)} style={{ cursor: 'pointer', padding: '5px 12px', borderRadius: '20px', border: '1px solid #00ff8866', color: '#00ff88', fontSize: '0.75rem' }}>#{t.trim()}</span>)}
                  </div>

                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => { 
                        setEditingId(video.id); 
                        setEditSource(video.source_tag || ''); 
                        setEditMusic(video.music_tag || ''); 
                        setEditExtra(video.extra_tags || ''); 
                    }} style={{ ...btnStyle, padding: '7px 18px', fontSize: '0.8rem', backgroundColor: '#222', color: '#fff' }}>
                      {user?.id === video.user_id ? '정보 수정' : '태그 기여'}
                    </button>
                    {user?.id === video.user_id && <button onClick={() => { if(confirm('영상을 목록에서 삭제하시겠습니까?')) supabase.from('videos').delete().eq('id', video.id).then(fetchVideos) }} style={{ color: '#ff4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>삭제</button>}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 6. 영상 재생 모달 */}
      {playingId && (
        <div onClick={() => setPlayingId(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ width: '90%', maxWidth: '1000px', aspectRatio: '16/9', position: 'relative' }} onClick={e => e.stopPropagation()}>
             <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${playingId}?autoplay=1`} frameBorder="0" allowFullScreen style={{ borderRadius: '20px', boxShadow: '0 0 30px rgba(255,0,0,0.3)' }}></iframe>
             <button onClick={() => setPlayingId(null)} style={{ position: 'absolute', top: '-40px', right: '0', color: '#fff', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>닫기 ✕</button>
          </div>
        </div>
      )}
    </div>
  );
}