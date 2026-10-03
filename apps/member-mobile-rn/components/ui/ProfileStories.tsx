import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors, Radius, Space } from '../../constants/tokens';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const { width: SW, height: SH } = Dimensions.get('window');

type StoryItem = {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  caption: string | null;
  viewCount: number;
  createdAt: string;
  expiresAt: string;
};

interface Props {
  username: string;
  isOwn?: boolean;
}

export function ProfileStories({ username, isOwn = false }: Props) {
  const me = useAuthStore((s) => s.user);
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [replySent, setReplySent] = useState(false);
  const [replySending, setReplySending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.get(`/social/stories/user/${encodeURIComponent(username)}`)
      .then((r) => Array.isArray(r.data?.stories) && setStories(r.data.stories))
      .catch(() => null);
  }, [username]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback((idx: number, storyList: StoryItem[]) => {
    stopTimer();
    const story = storyList[idx];
    if (!story) return;
    const DURATION = story.mediaType === 'VIDEO' ? 15000 : 5000;
    const TICK = 100;
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + (TICK / DURATION) * 100;
        if (next >= 100) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setActive((a) => (a !== null && a + 1 < storyList.length ? a + 1 : null));
          setProgress(0);
          return 0;
        }
        return next;
      });
    }, TICK);
  }, [stopTimer]);

  useEffect(() => {
    if (active === null) { stopTimer(); return; }
    setProgress(0);
    setReplyText('');
    setReplySent(false);
    // mark viewed
    if (stories[active]) {
      api.post(`/social/stories/${stories[active].id}/view`).catch(() => null);
    }
    startTimer(active, stories);
    return stopTimer;
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendReply = async () => {
    if (!replyText.trim() || active === null) return;
    setReplySending(true);
    try {
      await api.post(`/social/stories/${stories[active].id}/reply`, { text: replyText.trim() });
      setReplySent(true);
      setReplyText('');
    } catch {}
    setReplySending(false);
  };

  const openStory = (idx: number) => { setActive(idx); };
  const closeStory = () => { stopTimer(); setActive(null); };

  const prev = () => {
    if (active === null) return;
    if (active > 0) { setActive(active - 1); setProgress(0); }
  };
  const next = () => {
    if (active === null) return;
    if (active < stories.length - 1) { setActive(active + 1); setProgress(0); }
    else closeStory();
  };

  if (stories.length === 0 && !isOwn) return null;

  const story = active !== null ? stories[active] : null;

  return (
    <>
      {/* Halkalar */}
      <View style={styles.row}>
        {stories.map((s, i) => (
          <Pressable key={s.id} onPress={() => openStory(i)} style={styles.ringWrap}>
            <View style={styles.ring}>
              <Image
                source={{ uri: s.mediaUrl }}
                style={styles.thumb}
                resizeMode="cover"
              />
            </View>
          </Pressable>
        ))}
        {stories.length === 0 && isOwn && (
          <View style={styles.emptyHint}>
            <Text style={styles.emptyHintText}>Henüz hikaye yok</Text>
          </View>
        )}
      </View>

      {/* Görüntüleyici */}
      <Modal visible={story !== null} transparent animationType="fade" statusBarTranslucent onRequestClose={closeStory}>
        <View style={styles.viewer}>
          {/* Progress bar */}
          <View style={styles.progressRow}>
            {stories.map((_, i) => (
              <View key={i} style={styles.progressTrack}>
                <View style={[styles.progressFill, {
                  width: `${i < (active ?? 0) ? 100 : i === active ? progress : 0}%` as any,
                }]} />
              </View>
            ))}
          </View>

          {/* Medya */}
          {story && (
            <Image source={{ uri: story.mediaUrl }} style={styles.media} resizeMode="cover" />
          )}

          {/* Kapat */}
          <Pressable onPress={closeStory} style={styles.closeBtn} hitSlop={8}>
            <Text style={styles.closeTxt}>✕</Text>
          </Pressable>

          {/* Dokunma alanları */}
          <Pressable style={styles.tapLeft} onPress={prev} />
          <Pressable style={styles.tapRight} onPress={next} />

          {/* Alt panel */}
          {story && (
            <View style={styles.bottom}>
              {story.caption ? (
                <Text style={styles.caption} numberOfLines={3}>{story.caption}</Text>
              ) : null}

              {!isOwn && (
                <View style={styles.replyRow}>
                  {replySent ? (
                    <Text style={styles.replySent}>✓ Yanıtın gönderildi</Text>
                  ) : (
                    <>
                      <TextInput
                        value={replyText}
                        onChangeText={setReplyText}
                        placeholder="Hikayeye yanıt ver…"
                        placeholderTextColor="rgba(255,255,255,0.35)"
                        style={styles.replyInput}
                        maxLength={500}
                      />
                      <Pressable
                        onPress={sendReply}
                        disabled={replySending || !replyText.trim()}
                        style={[styles.sendBtn, (!replyText.trim() || replySending) && { opacity: 0.4 }]}
                      >
                        {replySending
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={{ color: '#fff', fontSize: 16 }}>↑</Text>
                        }
                      </Pressable>
                    </>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.s10, marginBottom: Space.s16 },
  ringWrap: { alignItems: 'center' },
  ring: {
    width: 64, height: 64, borderRadius: 32,
    padding: 2,
    backgroundColor: Colors.primary,
    overflow: 'hidden',
  },
  thumb: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: Colors.surface1 },
  emptyHint: { paddingVertical: Space.s8 },
  emptyHintText: { color: Colors.textMuted, fontSize: 13 },

  viewer: {
    flex: 1, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center',
  },
  progressRow: {
    position: 'absolute', top: 50, left: 12, right: 12,
    flexDirection: 'row', gap: 4, zIndex: 20,
  },
  progressTrack: {
    flex: 1, height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff' },
  media: { width: SW, height: SH, position: 'absolute' },
  closeBtn: {
    position: 'absolute', top: 60, right: 16, zIndex: 30,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  tapLeft: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', zIndex: 10 },
  tapRight: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '40%', zIndex: 10 },
  bottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 25,
    backgroundColor: 'rgba(10,10,10,0.85)',
    padding: Space.s12,
  },
  caption: { color: '#fff', fontSize: 13, lineHeight: 20, marginBottom: Space.s8 },
  replyRow: { flexDirection: 'row', alignItems: 'center', gap: Space.s8 },
  replyInput: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Space.s14, paddingVertical: Space.s8,
    color: '#fff', fontSize: 13,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  replySent: { color: Colors.primary, fontSize: 13, paddingVertical: Space.s8 },
});
