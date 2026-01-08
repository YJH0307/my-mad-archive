'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qgqdygeuxamtfscakqaf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncWR5Z2V1eGFtdGZzY2FrcWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTUxNzcsImV4cCI6MjA4MzM3MTE3N30.Z1rwozI8Z0EsJuOo7jCvxxazSA2gtCh3ri-v38OKnso';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ⚠️ 발급받은 실제 유튜브 API 키를 아래 따옴표 안에 넣어주세요!
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

  // 대량 등록 상태
  const [bulkQueue, setBulkQueue] = useState<any[]>([]);
  const [bulkIndex, setBulkIndex] = useState(0);
  const [isBulkMode, setIsBulkMode] = useState(false);

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

  // 유튜브 API 엔진
  const fetchPlaylistVideos = async () => {
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === '여기에_유튜브_API_키를_붙여넣으세요') {
      return alert('코드 상단의 YOUTUBE_API_KEY를 먼저 설정해주세요!');
    }
    const playlistMatch = url.match(/[&?]list=([^&]+)/);
    if (!playlistMatch) return alert('올바른 재생목록 URL(list= 포함)을 입력해주세요.');

    alert('재생목록 분석 중...');
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistMatch[1]}&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      if (!data.items) throw new Error('API 키가 잘못되었거나 비공개 목록입니다.');

      const extracted = data.items.map((item: any) => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        uploader: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle
      })).filter((v: any) => !videoList.some(reg => reg.youtube_id === v.id));

      if (extracted.length === 0) return alert('새로 등록할 영상이 없습니다!');
      setBulkQueue(extracted); setBulkIndex(0); setIsBulkMode(true);
      loadBulkVideo(extracted[0]);
    } catch (e) { alert('에러 발생: API 설정을 확인하세요.'); }
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
    } else {
      alert('모든 작업 완료!'); setIsBulkMode(false); setVideoId(''); fetchVideos();
    }
  };

  const handleRegister = async () => {
    const { error } = await supabase.from('videos').insert([{ 
      youtube_id: videoId, title, user_email: uploader, 
      source_tag: sourceTag, music_tag: musicTag, extra_tags: extraTags, user_id: user.id
    }]);
    if (error) alert(error.message);
    else { if (isBulkMode) skipToNext(); else { alert('등록 성공!'); setVideoId(''); fetchVideos(); } }
  };

  const handleUpdateTags = async (video: any) => {
    const isOwner = user.id === video.user_id;
    let finalSource = editSource, finalMusic = editMusic, finalExtra = editExtra;
    if (!isOwner) {
      const combine = (old: string, add: string) => {
        const oldSet = new Set((old || "").split(',').map(s => s.trim()).filter(Boolean));
        add.split(',').map(s => s.trim()).filter(Boolean).forEach(tag => oldSet.add(tag));
        return Array.from(oldSet).join(', ');
      };
      finalSource = combine(video.source_tag, editSource);
      finalMusic = combine(video.music_tag, editMusic);
      finalExtra = combine(video.extra_tags || '', editExtra);
    }
    const { error } = await supabase.from('videos').update({ source_tag: finalSource, music_tag: finalMusic, extra_tags: finalExtra }).eq('id', video.id);
    if (error) alert(error.message);
    else { alert('반영 완료!'); setEditingId(null); fetchVideos(); }
  };

  return (
    <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* 1. 로그인 바 */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: '#161616', padding: '15px', borderRadius: '25px', border: '1px solid #333', zIndex: 10 }}>
        {user ? (
          <div><div style={{ fontSize: '0.75rem', color: '#888' }}>{user.email}</div><button onClick={() => supabase.auth.signOut()} style={{ ...btnStyle, marginTop: '5px', padding: '5px 10px', fontSize: '0.7rem' }}>로그아웃</button></div>
        ) : (
          <div style={{ display: 'flex', gap: '5px' }}>
            <input placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} style={{ ...inputStyle, width: '120px', padding: '8px', borderRadius: '15px' }} />
            <input type="password" placeholder="비번" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputStyle, width: '120px', padding: '8px', borderRadius: '15px' }} />
            <button onClick={() => supabase.auth.signInWithPassword({email, password})} style={{ ...btnStyle, padding: '8px 12px' }}>로그인</button>
          </div>
        )}
      </div>

      <h1 style={{ fontSize: '3rem', color: '#ff0000', fontWeight: '900', letterSpacing: '-2px' }}>KR MAD ARCHIVE</h1>
      
      {/* 2. 대량 등록 모드 표시 */}
      {isBulkMode && (
        <div style={{ backgroundColor: '#ff000022', padding: '15px', borderRadius: '30px', border: '1px solid #ff0000', marginBottom: '30px', display: 'inline-block' }}>
          🚀 <b>연속 모드:</b> {bulkIndex + 1} / {bulkQueue.length}
          <button onClick={skipToNext} style={{ marginLeft: '15px', padding: '5px 15px', borderRadius: '15px', border: '1px solid #fff', background: 'none', color: '#fff', cursor: 'pointer' }}>스킵</button>
        </div>
      )}

      {/* 3. 등록 섹션 */}
      {user && (
        <div style={{ margin: '20px auto 40px auto', padding: '30px', backgroundColor: '#111', borderRadius: '40px', maxWidth: '550px', border: '1px solid #222', textAlign: 'left' }}>
          {!isBulkMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input placeholder="유튜브 재생목록 URL (list= 포함)" value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
              <button onClick={fetchPlaylistVideos} style={{ ...btnStyle, backgroundColor: '#ff0000', color: '#fff' }}>재생목록 추출 시작</button>
            </div>
          ) : null}

          {videoId && (
            <div style={{ marginTop: '20px' }}>
              <img src={thumbnail} width="100%" style={{ borderRadius: '30px', border: '1px solid #333' }} />
              <div style={{ margin: '15px 0', fontSize: '0.9rem' }}><b>제목:</b> {title}<br/><b>채널:</b> {uploader}</div>
              <input placeholder="소스 태그 (쉼표 구분)" value={sourceTag} onChange={e => setSourceTag(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
              <input placeholder="원곡 태그 (쉼표 구분)" value={musicTag} onChange={e => setMusicTag(e.target.value)} style={{ ...inputStyle, marginBottom: '10px' }} />
              <input placeholder="기타 태그 (쉼표 구분)" value={extraTags} onChange={e => setExtraTags(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }} />
              <button onClick={handleRegister} style={{ ...btnStyle, width: '100%', backgroundColor: '#fff', color: '#000', fontSize: '1.1rem' }}>등록 후 다음으로</button>
            </div>
          )}
        </div>
      )}

      {/* 4. 검색 & 목록 */}
      <div style={{ margin: '40px 0' }}><input placeholder="아카이브 통합 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, width: '80%', maxWidth: '700px', textAlign: 'center', borderRadius: '50px' }} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px', padding: '0 20px' }}>
        {filteredVideos.map((video: any) => (
          <div key={video.id} style={{ backgroundColor: '#111', borderRadius: '40px', overflow: 'hidden', border: '1px solid #222', textAlign: 'left' }}>
            <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} width="100%" onClick={() => setPlayingId(video.youtube_id)} style={{ cursor: 'pointer' }} />
            <div style={{ padding: '20px' }}>
              {editingId === video.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input value={editSource} onChange={e => setEditSource(e.target.value)} placeholder="소스 태그" style={{ ...inputStyle, borderRadius: '15px', padding: '10px' }} />
                  <input value={editMusic} onChange={e => setEditMusic(e.target.value)} placeholder="원곡 태그" style={{ ...inputStyle, borderRadius: '15px', padding: '10px' }} />
                  <input value={editExtra} onChange={e => setEditExtra(e.target.value)} placeholder="기타 태그" style={{ ...inputStyle, borderRadius: '15px', padding: '10px' }} />
                  <div style={{ display: 'flex', gap: '5px' }}><button onClick={() => handleUpdateTags(video)} style={{ ...btnStyle, flex: 1, backgroundColor: '#00ff88' }}>저장</button><button onClick={() => setEditingId(null)} style={{ ...btnStyle, flex: 1 }}>취소</button></div>
                </div>
              ) : (
                <>
                  <h3 style={{ fontSize: '1rem', marginBottom: '5px' }}>{video.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '15px' }}>📺 {video.user_email}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {video.source_tag?.split(',').map((t:any, i:any) => <span key={i} style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid #ff000066', color: '#ff0000', fontSize: '0.7rem' }}>#{t.trim()}</span>)}
                    {video.music_tag?.split(',').map((t:any, i:any) => <span key={i} style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid #0070f366', color: '#0070f3', fontSize: '0.7rem' }}>#{t.trim()}</span>)}
                  </div>
                  <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
                    <button onClick={() => { setEditingId(video.id); setEditSource(user?.id === video.user_id ? video.source_tag : ''); setEditMusic(user?.id === video.user_id ? video.music_tag : ''); setEditExtra(user?.id === video.user_id ? video.extra_tags || '' : ''); }} style={{ ...btnStyle, padding: '5px 15px', fontSize: '0.75rem', backgroundColor: '#222', color: '#fff' }}>기여/수정</button>
                    {user?.id === video.user_id && <button onClick={() => { if(confirm('삭제할까요?')) supabase.from('videos').delete().eq('id', video.id).then(fetchVideos) }} style={{ color: '#ff4444', background: 'none', border: 'none', cursor: 'pointer' }}>삭제</button>}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {playingId && (
        <div onClick={() => setPlayingId(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ width: '80%', maxWidth: '900px', aspectRatio: '16/9' }} onClick={e => e.stopPropagation()}>
             <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${playingId}?autoplay=1`} frameBorder="0" allowFullScreen style={{ borderRadius: '40px' }}></iframe>
          </div>
        </div>
      )}
    </div>
  );
}