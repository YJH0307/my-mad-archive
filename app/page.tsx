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
  const [extraTags, setExtraTags] = useState('');
  
  const [videoList, setVideoList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSource, setEditSource] = useState('');
  const [editMusic, setEditMusic] = useState('');
  const [editExtra, setEditExtra] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    fetchVideos();
  }, []);

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
      alert('성공! 아카이브에 등록되었습니다.');
      setUrl(''); setThumbnail(''); setSourceTag(''); setMusicTag(''); setExtraTags('');
      fetchVideos();
    }
  };

  const handleUpdateTags = async (video: any) => {
    if (!user) return alert('로그인이 필요합니다!');
    
    const isOwner = user.id === video.user_id;
    let finalSource = editSource;
    let finalMusic = editMusic;
    let finalExtra = editExtra;

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

    const { error } = await supabase.from('videos')
      .update({ source_tag: finalSource, music_tag: finalMusic, extra_tags: finalExtra })
      .eq('id', video.id);

    if (error) alert(error.message);
    else {
      alert(isOwner ? '수정 완료!' : '태그 추가 완료!');
      setEditingId(null);
      fetchVideos();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await supabase.from('videos').delete().eq('id', id);
      fetchVideos();
    }
  };

  const TagChips = ({ tags, color }: { tags: string, color: string }) => {
    if (!tags) return null;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
        {tags.split(',').map((tag: string, i: number) => (
          <span key={i} style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', backgroundColor: color + '22', color: color, border: `1px solid ${color}44` }}>
            #{tag.trim()}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* 로그인 영역 */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: '#111', padding: '15px', borderRadius: '10px', border: '1px solid #333', zIndex: 10 }}>
        {user ? (
          <div><div style={{ fontSize: '0.8rem' }}>{user.email}</div><button onClick={() => supabase.auth.signOut()}>로그아웃</button></div>
        ) : (
          <div>
            <input placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: '5px', display: 'block', padding: '5px', backgroundColor: '#000', color: '#fff' }} />
            <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} style={{ marginBottom: '10px', display: 'block', padding: '5px', backgroundColor: '#000', color: '#fff' }} />
            <button onClick={() => supabase.auth.signInWithPassword({email, password})}>로그인</button>
            <button onClick={() => supabase.auth.signUp({email, password})}>가입</button>
          </div>
        )}
      </div>

      <h1 style={{ color: '#ff0000', marginTop: '50px', fontWeight: '900' }}>KR 음MAD ARCHIVE</h1>

      {user && (
        <div style={{ margin: '30px 0', padding: '20px', backgroundColor: '#111', borderRadius: '15px', display: 'inline-block', border: '1px solid #222' }}>
          <input placeholder="유튜브 링크" value={url} onChange={e => setUrl(e.target.value)} style={{ padding: '10px' }} />
          <button onClick={handleIdentify}>확인</button>
          {thumbnail && (
            <div style={{ marginTop: '15px' }}>
              <img src={thumbnail} width="350" style={{ borderRadius: '10px' }} />
              <input placeholder="소스(쉼표)" value={sourceTag} onChange={e => setSourceTag(e.target.value)} style={{ display: 'block', width: '100%', margin: '10px 0', padding: '10px' }} />
              <input placeholder="원곡(쉼표)" value={musicTag} onChange={e => setMusicTag(e.target.value)} style={{ display: 'block', width: '100%', margin: '10px 0', padding: '10px' }} />
              <input placeholder="추가 태그" value={extraTags} onChange={e => setExtraTags(e.target.value)} style={{ display: 'block', width: '100%', margin: '10px 0', padding: '10px' }} />
              <button onClick={handleRegister} style={{ width: '100%', padding: '12px', background: '#fff', color: '#000', fontWeight: 'bold' }}>등록하기</button>
            </div>
          )}
        </div>
      )}

      <div style={{ margin: '30px 0' }}><input placeholder="태그 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ padding: '15px', width: '500px', borderRadius: '25px', textAlign: 'center' }} /></div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
        {videoList.filter((v: any) => (v.source_tag+v.music_tag+v.extra_tags).toLowerCase().includes(searchTerm.toLowerCase())).map((video: any) => (
          <div key={video.id} style={{ backgroundColor: '#111', borderRadius: '15px', border: '1px solid #222', textAlign: 'left', overflow: 'hidden' }}>
            <img src={`https://img.youtube.com/vi/${video.youtube_id}/mqdefault.jpg`} width="100%" onClick={() => setPlayingId(video.youtube_id)} style={{ cursor: 'pointer' }} />
            <div style={{ padding: '20px' }}>
              {editingId === video.id ? (
                <div>
                  <input value={editSource} onChange={e => setEditSource(e.target.value)} placeholder="소스" style={{ width: '100%', marginBottom: '5px' }} />
                  <input value={editMusic} onChange={e => setEditMusic(e.target.value)} placeholder="원곡" style={{ width: '100%', marginBottom: '5px' }} />
                  <input value={editExtra} onChange={e => setEditExtra(e.target.value)} placeholder="기타" style={{ width: '100%', marginBottom: '10px' }} />
                  <button onClick={() => handleUpdateTags(video)}>저장</button>
                  <button onClick={() => setEditingId(null)}>취소</button>
                </div>
              ) : (
                <>
                  <TagChips tags={video.source_tag} color="#ff0000" />
                  <TagChips tags={video.music_tag} color="#0070f3" />
                  <TagChips tags={video.extra_tags} color="#00ff88" />
                  <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <button onClick={() => {
                      setEditingId(video.id);
                      const isOwner = user?.id === video.user_id;
                      setEditSource(isOwner ? video.source_tag : '');
                      setEditMusic(isOwner ? video.music_tag : '');
                      setEditExtra(isOwner ? video.extra_tags || '' : '');
                    }} style={{ fontSize: '0.75rem' }}>
                      {user?.id === video.user_id ? '수정' : '태그 기여'}
                    </button>
                    {user?.id === video.user_id && <button onClick={() => handleDelete(video.id)} style={{ fontSize: '0.75rem', color: 'red' }}>삭제</button>}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {playingId && (
        <div onClick={() => setPlayingId(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ width: '85%', maxWidth: '900px', aspectRatio: '16/9' }} onClick={e => e.stopPropagation()}><iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${playingId}?autoplay=1`} frameBorder="0" allowFullScreen></iframe></div>
        </div>
      )}
    </div>
  );
}