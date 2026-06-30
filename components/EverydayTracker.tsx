'use client';

/* eslint-disable react-hooks/refs */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Moon, 
  Sun, 
  Settings, 
  Trash2, 
  X, 
  Check, 
  RefreshCw,
  LogOut,
  User,
  Copy
} from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import { 
  getLocalDateString, 
  getOffsetDateString, 
  calculateCurrentStreak, 
  calculateLongestStreak 
} from '@/lib/streaks';

interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: string;
}

interface Completion {
  id: string;
  habitId: string;
  date: string;
  status: 'completed' | 'skipped';
}

interface ColorConfig {
  name: string;
  bgClass: string;
  bgHoverClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
}

const COLOR_OPTIONS: Record<string, ColorConfig> = {
  emerald: {
    name: 'Green',
    bgClass: 'bg-emerald-600 dark:bg-emerald-600',
    bgHoverClass: 'hover:bg-emerald-700 dark:hover:bg-emerald-500',
    borderClass: 'border-emerald-600/30 dark:border-emerald-600/30',
    textClass: 'text-emerald-800 dark:text-emerald-400',
    badgeClass: 'bg-emerald-50/90 dark:bg-emerald-950/25 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-950/40 font-extrabold',
  },
  sky: {
    name: 'Blue',
    bgClass: 'bg-sky-600 dark:bg-sky-600',
    bgHoverClass: 'hover:bg-sky-700 dark:hover:bg-sky-500',
    borderClass: 'border-sky-600/30 dark:border-sky-600/30',
    textClass: 'text-sky-800 dark:text-sky-400',
    badgeClass: 'bg-sky-50/90 dark:bg-sky-950/25 text-sky-800 dark:text-sky-400 border border-sky-200 dark:border-sky-950/40 font-extrabold',
  },
  indigo: {
    name: 'Indigo',
    bgClass: 'bg-indigo-600 dark:bg-indigo-600',
    bgHoverClass: 'hover:bg-indigo-700 dark:hover:bg-indigo-500',
    borderClass: 'border-indigo-600/30 dark:border-indigo-600/30',
    textClass: 'text-indigo-800 dark:text-indigo-400',
    badgeClass: 'bg-indigo-50/90 dark:bg-indigo-950/25 text-indigo-800 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-950/40 font-extrabold',
  },
  amber: {
    name: 'Yellow',
    bgClass: 'bg-amber-600 dark:bg-amber-600',
    bgHoverClass: 'hover:bg-amber-700 dark:hover:bg-amber-500',
    borderClass: 'border-amber-600/30 dark:border-amber-600/30',
    textClass: 'text-amber-800 dark:text-amber-400',
    badgeClass: 'bg-amber-50/90 dark:bg-amber-950/25 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-950/40 font-extrabold',
  },
  orange: {
    name: 'Orange',
    bgClass: 'bg-orange-600 dark:bg-orange-600',
    bgHoverClass: 'hover:bg-orange-700 dark:hover:bg-orange-500',
    borderClass: 'border-orange-600/30 dark:border-orange-600/30',
    textClass: 'text-orange-800 dark:text-orange-400',
    badgeClass: 'bg-orange-50/90 dark:bg-orange-950/25 text-orange-800 dark:text-orange-400 border border-orange-200 dark:border-orange-950/40 font-extrabold',
  },
  purple: {
    name: 'Purple',
    bgClass: 'bg-purple-600 dark:bg-purple-600',
    bgHoverClass: 'hover:bg-purple-700 dark:hover:bg-purple-500',
    borderClass: 'border-purple-600/30 dark:border-purple-600/30',
    textClass: 'text-purple-800 dark:text-purple-400',
    badgeClass: 'bg-purple-50/90 dark:bg-purple-950/25 text-purple-800 dark:text-purple-400 border border-purple-200 dark:border-purple-950/40 font-extrabold',
  },
  rose: {
    name: 'Pink',
    bgClass: 'bg-rose-600 dark:bg-rose-600',
    bgHoverClass: 'hover:bg-rose-700 dark:hover:bg-rose-500',
    borderClass: 'border-rose-600/30 dark:border-rose-600/30',
    textClass: 'text-rose-800 dark:text-rose-400',
    badgeClass: 'bg-rose-50/90 dark:bg-rose-950/25 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-950/40 font-extrabold',
  },
  red: {
    name: 'Red',
    bgClass: 'bg-red-600 dark:bg-red-600',
    bgHoverClass: 'hover:bg-red-700 dark:hover:bg-red-500',
    borderClass: 'border-red-600/30 dark:border-red-600/30',
    textClass: 'text-red-800 dark:text-red-400',
    badgeClass: 'bg-red-50/90 dark:bg-red-950/25 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-950/40 font-extrabold',
  }
};

interface ColorSpec {
  hue: number;
  saturation: number;
  lightnessLight: number;
  lightnessDark: number;
}

const COLOR_MAP: Record<string, ColorSpec> = {
  emerald: { hue: 142, saturation: 70, lightnessLight: 42, lightnessDark: 48 },
  sky:     { hue: 199, saturation: 89, lightnessLight: 45, lightnessDark: 50 },
  indigo:  { hue: 239, saturation: 84, lightnessLight: 54, lightnessDark: 58 },
  amber:   { hue: 38,  saturation: 93, lightnessLight: 44, lightnessDark: 48 },
  orange:  { hue: 24,  saturation: 95, lightnessLight: 48, lightnessDark: 52 },
  purple:  { hue: 271, saturation: 81, lightnessLight: 52, lightnessDark: 56 },
  rose:    { hue: 350, saturation: 89, lightnessLight: 52, lightnessDark: 56 },
  red:     { hue: 0,   saturation: 84, lightnessLight: 50, lightnessDark: 54 },
};

function getStreakInfoAtDate(completedDates: string[], targetDateStr: string) {
  const datesSet = new Set(completedDates);
  if (!datesSet.has(targetDateStr)) {
    return { isCompleted: false, index: 0, length: 0 };
  }

  // Walk backwards to find the start date of this streak
  let start = targetDateStr;
  let checkDate = getOffsetDateString(targetDateStr, -1);
  while (datesSet.has(checkDate)) {
    start = checkDate;
    checkDate = getOffsetDateString(checkDate, -1);
  }

  // Walk forwards to collect all dates in this streak
  const streakDates: string[] = [start];
  checkDate = getOffsetDateString(start, 1);
  while (datesSet.has(checkDate)) {
    streakDates.push(checkDate);
    checkDate = getOffsetDateString(checkDate, 1);
  }

  const index = streakDates.indexOf(targetDateStr);
  const length = streakDates.length;
  return { isCompleted: true, index, length };
}

function getCellStyle(colorKey: string, isCompleted: boolean, index: number, length: number, isDarkMode: boolean) {
  const spec = COLOR_MAP[colorKey] || COLOR_MAP.emerald;
  const { hue, saturation } = spec;

  if (!isCompleted) {
    return {
      backgroundColor: isDarkMode ? 'rgba(39, 39, 42, 0.45)' : 'rgba(244, 244, 245, 0.95)',
      color: 'transparent',
    };
  }

  // Dynamic vs. Fixed Logic
  // Vibrant Anchors
  const startL = isDarkMode ? 70 : 76;
  const endFixedL = isDarkMode ? 24 : 28; // Day 10 anchor (rich green, not almost-black)
  const endL = isDarkMode ? 8 : 11; // Dark forest green (Day 27 newest day target)
  const minL = isDarkMode ? 5 : 7; // Deepest forest green/almost black for even longer streaks
  const startSFactor = isDarkMode ? 0.85 : 0.92;
  const endSFactor = 1.15;

  let l = startL;
  let sFactor = startSFactor;

  if (index < 10) {
    // Exact same fixed color progression for the first 10 completed days.
    // Transition smoothly from startL (Day 1) to endFixedL (Day 10).
    const tFixed = index / 9;
    const progress = Math.pow(tFixed, 1.2); // Slower initial darkening, stays bright & saturated
    l = startL + progress * (endFixedL - startL);
    sFactor = startSFactor + progress * (endSFactor - startSFactor);
  } else {
    // Only starts dynamic logic after Day 10 (index >= 10).
    // Transition from endFixedL (Day 10) to a highly customized, slow-darkening target.
    // For long streaks (11+ days), we distribute the contrast across the whole remaining length.
    const tExtra = (index - 9) / (length - 1 - 9);
    
    // We want the newest day of a very long streak to converge gracefully towards minL,
    // but a streak of length 27 should end exactly at endL.
    const targetEndL = length <= 27 
      ? endL 
      : endL + (1 - Math.exp(-(length - 27) / 50)) * (minL - endL);
    
    const progressExtra = Math.pow(tExtra, 1.1); // Beautiful, nearly linear gradual darkening
    l = endFixedL + progressExtra * (targetEndL - endFixedL);
    sFactor = endSFactor;
  }

  const s = Math.min(100, Math.round(saturation * sFactor));

  // Ensure high contrast text/indicator color based on computed lightness
  const textColor = l >= 65 ? `hsl(${hue}, ${saturation}%, 20%)` : '#ffffff';

  return {
    backgroundColor: `hsl(${hue}, ${Math.round(s)}%, ${Math.round(l)}%)`,
    color: textColor,
  };
}

function getRoundedCornersClass(
  dateStr: string,
  completedDates: string[]
): string {
  const datesSet = new Set(completedDates);
  const isCompleted = datesSet.has(dateStr);
  if (!isCompleted) return 'rounded-none';

  // Calculate continuity from ALL completions (viewport independent)
  const hasPrev = datesSet.has(getOffsetDateString(dateStr, -1));
  const hasNext = datesSet.has(getOffsetDateString(dateStr, 1));

  if (hasPrev && hasNext) {
    return 'rounded-none';
  } else if (hasPrev) {
    return 'rounded-r-lg rounded-l-none';
  } else if (hasNext) {
    return 'rounded-l-lg rounded-r-none';
  }
  return 'rounded-lg';
}

interface EmojiData {
  char: string;
  category: string;
  keywords: string[];
}

const EMOJI_POOL: EmojiData[] = [
  // Fitness
  { char: '🏃', category: 'Fitness', keywords: ['run', 'running', 'cardio', 'fitness', 'sport', 'exercise', 'jog'] },
  { char: '🏃‍♀️', category: 'Fitness', keywords: ['run', 'running', 'woman', 'girl', 'cardio', 'fitness', 'sport', 'exercise'] },
  { char: '🏋️', category: 'Fitness', keywords: ['weight', 'gym', 'lifting', 'strength', 'workout', 'fitness', 'exercise'] },
  { char: '🧘', category: 'Fitness', keywords: ['yoga', 'meditate', 'meditation', 'stretch', 'zen', 'calm', 'mind'] },
  { char: '🚴', category: 'Fitness', keywords: ['bike', 'cycling', 'bicycle', 'ride', 'fitness', 'cardio'] },
  { char: '🚶', category: 'Fitness', keywords: ['walk', 'walking', 'steps', 'stroll', 'cardio', 'fitness'] },
  { char: '🏊', category: 'Fitness', keywords: ['swim', 'swimming', 'pool', 'water', 'cardio'] },
  { char: '🧗', category: 'Fitness', keywords: ['climb', 'climbing', 'mountain', 'hiking', 'nature'] },
  { char: '🤸', category: 'Fitness', keywords: ['gymnast', 'cartwheel', 'exercise', 'stretch'] },
  { char: '⚽', category: 'Fitness', keywords: ['soccer', 'football', 'ball', 'sport', 'game'] },
  { char: '🏀', category: 'Fitness', keywords: ['basketball', 'ball', 'sport', 'game'] },
  
  // Health
  { char: '🍏', category: 'Health', keywords: ['apple', 'green', 'fruit', 'food', 'healthy', 'diet', 'eat'] },
  { char: '🍎', category: 'Health', keywords: ['apple', 'red', 'fruit', 'food', 'healthy', 'diet', 'eat'] },
  { char: '🥗', category: 'Health', keywords: ['salad', 'vegetable', 'healthy', 'food', 'diet', 'eat', 'green'] },
  { char: '🥦', category: 'Health', keywords: ['broccoli', 'vegetable', 'healthy', 'food', 'diet', 'eat', 'green'] },
  { char: '🥑', category: 'Health', keywords: ['avocado', 'healthy', 'food', 'diet', 'eat'] },
  { char: '🥕', category: 'Health', keywords: ['carrot', 'vegetable', 'healthy', 'food', 'diet', 'eat'] },
  { char: '🍌', category: 'Health', keywords: ['banana', 'fruit', 'healthy', 'food', 'eat'] },
  { char: '🦷', category: 'Health', keywords: ['tooth', 'teeth', 'dental', 'brush', 'hygiene', 'clean'] },
  { char: '🛌', category: 'Health', keywords: ['sleep', 'bed', 'rest', 'nap', 'tired'] },
  { char: '💤', category: 'Health', keywords: ['sleep', 'snooze', 'rest', 'nap', 'tired', 'dream'] },
  { char: '💊', category: 'Health', keywords: ['pill', 'meds', 'medicine', 'vitamin', 'supplement', 'health'] },
  { char: '🩹', category: 'Health', keywords: ['bandaid', 'heal', 'wound', 'injury', 'recovery'] },
  { char: '💧', category: 'Health', keywords: ['water', 'drink', 'hydrate', 'hydration', 'clean'] },
  { char: '🥛', category: 'Health', keywords: ['milk', 'glass', 'drink', 'hydrate', 'calcium'] },
  
  // Reading & Learning
  { char: '📖', category: 'Learning', keywords: ['book', 'read', 'reading', 'learn', 'study', 'school'] },
  { char: '📚', category: 'Learning', keywords: ['books', 'library', 'read', 'reading', 'learn', 'study', 'school'] },
  { char: '🧠', category: 'Learning', keywords: ['brain', 'mind', 'think', 'smart', 'intellect', 'learning'] },
  { char: '🎓', category: 'Learning', keywords: ['graduation', 'diploma', 'study', 'learn', 'school', 'college', 'university'] },
  { char: '🔬', category: 'Learning', keywords: ['microscope', 'science', 'research', 'learn', 'lab'] },
  { char: '🪐', category: 'Learning', keywords: ['planet', 'space', 'astronomy', 'science', 'learn'] },
  
  // Work & Productivity
  { char: '💻', category: 'Productivity', keywords: ['computer', 'laptop', 'code', 'coding', 'program', 'developer', 'work', 'tech'] },
  { char: '📓', category: 'Productivity', keywords: ['notebook', 'journal', 'write', 'writing', 'diary', 'note'] },
  { char: '✍️', category: 'Productivity', keywords: ['write', 'writing', 'pencil', 'journal', 'work', 'note'] },
  { char: '📝', category: 'Productivity', keywords: ['memo', 'note', 'document', 'todo', 'task', 'checklist', 'write'] },
  { char: '📈', category: 'Productivity', keywords: ['chart', 'graph', 'growth', 'finance', 'stocks', 'business', 'work'] },
  { char: '⏰', category: 'Productivity', keywords: ['clock', 'time', 'alarm', 'early', 'routine', 'schedule', 'wake'] },
  { char: '⏱️', category: 'Productivity', keywords: ['timer', 'stopwatch', 'time', 'duration', 'workout'] },
  { char: '🎯', category: 'Productivity', keywords: ['target', 'goal', 'focus', 'aim', 'achieve'] },
  { char: '💼', category: 'Productivity', keywords: ['briefcase', 'work', 'business', 'job', 'office'] },
  { char: '📅', category: 'Productivity', keywords: ['calendar', 'date', 'schedule', 'plan'] },
  
  // Finance
  { char: '💰', category: 'Finance', keywords: ['money', 'cash', 'wealth', 'save', 'saving', 'budget', 'finance', 'rich'] },
  { char: '💵', category: 'Finance', keywords: ['dollar', 'cash', 'money', 'finance', 'budget', 'save'] },
  { char: '🐷', category: 'Finance', keywords: ['piggy', 'bank', 'save', 'saving', 'money', 'budget'] },
  
  // Cleaning & Home
  { char: '🧹', category: 'Cleaning', keywords: ['broom', 'clean', 'sweep', 'chores', 'house', 'tidy'] },
  { char: '🧼', category: 'Cleaning', keywords: ['soap', 'clean', 'wash', 'shower', 'hands', 'hygiene'] },
  { char: '🧺', category: 'Cleaning', keywords: ['laundry', 'basket', 'clean', 'wash', 'clothes'] },
  { char: '🍳', category: 'Cleaning', keywords: ['cook', 'cooking', 'pan', 'breakfast', 'food', 'meal'] },
  { char: '🍽️', category: 'Cleaning', keywords: ['plate', 'fork', 'knife', 'meal', 'food', 'eat', 'dinner'] },
  
  // Nature & Garden
  { char: '🌱', category: 'Nature', keywords: ['sprout', 'plant', 'seed', 'grow', 'nature', 'garden', 'green'] },
  { char: '🌳', category: 'Nature', keywords: ['tree', 'forest', 'nature', 'wood', 'outdoor'] },
  { char: '☀️', category: 'Nature', keywords: ['sun', 'sunny', 'morning', 'daylight', 'warm', 'weather'] },
  { char: '🌸', category: 'Nature', keywords: ['flower', 'bloom', 'spring', 'nature', 'garden'] },
  { char: '🐾', category: 'Nature', keywords: ['paw', 'pet', 'dog', 'cat', 'animal', 'walk'] },
  
  // Creativity & Leisure
  { char: '🎨', category: 'Creativity', keywords: ['paint', 'art', 'artist', 'creative', 'draw', 'drawing'] },
  { char: '🎹', category: 'Creativity', keywords: ['piano', 'keyboard', 'music', 'play', 'instrument'] },
  { char: '🎸', category: 'Creativity', keywords: ['guitar', 'music', 'play', 'instrument', 'song'] },
  { char: '🎵', category: 'Creativity', keywords: ['music', 'note', 'song', 'audio', 'sound'] },
  { char: '📸', category: 'Creativity', keywords: ['camera', 'photo', 'photography', 'picture', 'hobby'] },
  { char: '☕', category: 'Creativity', keywords: ['coffee', 'tea', 'cafe', 'drink', 'morning', 'warm'] },
  { char: '🍵', category: 'Creativity', keywords: ['tea', 'matcha', 'drink', 'warm', 'green'] },
];

const POPULAR_EMOJIS = [
  '🍏', '🏋️', '🧘', '🏃', '💧', '🚴', '🥗', '🦷',
  '📓', '📖', '🎹', '🎸', '🧠', '🎨', '✍️', '☕',
  '💻', '📈', '⏰', '🎯', '🧹', '🛌', '🚶', '🌱',
  '📚', '🍎', '🥦', '🥛', '💤', '💊', '📝', '💰',
  '🧼', '☀️', '🌸', '📸'
];

function getFirstEmoji(text: string): string | null {
  if (!text) return null;
  
  try {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
    const segments = Array.from(segmenter.segment(text));
    
    for (const seg of segments) {
      const g = seg.segment;
      if (/\p{Extended_Pictographic}/u.test(g) || /\p{Emoji_Presentation}/u.test(g)) {
        if (/^[0-9#*]$/.test(g)) {
          continue;
        }
        return g;
      }
    }
  } catch (e) {
    const match = text.match(/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/gu);
    if (match) {
      for (const m of match) {
        if (!/^[0-9#*]$/.test(m)) {
          return m;
        }
      }
    }
  }
  
  return null;
}

export default function EverydayTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState<boolean>(() => {
    const supabase = getSupabaseBrowserClient();
    return !!supabase;
  });
  const isDarkMode = true;
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [user, setUser] = useState<any>(() => {
    const supabase = getSupabaseBrowserClient();
    return supabase ? undefined : null;
  });
  
  // Date and grid offset state (offset in days from today)
  const [offsetDays, setOffsetDays] = useState(0);
  
  // Clean single modal state
  const [activeModal, setActiveModal] = useState<null | 'create' | { type: 'edit'; habit: Habit }>(null);
  const [modalName, setModalName] = useState('');
  const [modalEmoji, setModalEmoji] = useState('🍏');
  const [modalColor, setModalColor] = useState('emerald');
  const [submitting, setSubmitting] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Emoji Picker state
  const [emojiSearch, setEmojiSearch] = useState('');
  const [customEmojiText, setCustomEmojiText] = useState('');
  const [customEmojiError, setCustomEmojiError] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const filteredEmojis = React.useMemo(() => {
    if (!emojiSearch.trim()) return [];
    const query = emojiSearch.toLowerCase().trim();
    const results = EMOJI_POOL.filter(item => {
      return (
        item.char === query ||
        item.category.toLowerCase().includes(query) ||
        item.keywords.some(k => k.includes(query))
      );
    }).map(item => item.char);
    return Array.from(new Set(results));
  }, [emojiSearch]);

  const handleCustomEmojiChange = (val: string) => {
    setCustomEmojiText(val);
    if (!val) {
      setCustomEmojiError('');
      return;
    }
    const emoji = getFirstEmoji(val);
    if (emoji) {
      setModalEmoji(emoji);
      setCustomEmojiError('');
    } else {
      setCustomEmojiError('No valid emoji found in input.');
    }
  };

  // Timezone safe today reference
  const todayStr = getLocalDateString(new Date());

  // Onboarding, settings, Gmail, and Shame state variables
  const [partnerName, setPartnerName] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [userName, setUserName] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showShameOverlay, setShowShameOverlay] = useState(false);
  const shameOverlayRef = useRef(false);
  const [shamePostText, setShamePostText] = useState('');
  const shameTwitterClicked = useRef(false);
  const shameLinkedinClicked = useRef(false);
  const [, forceUpdate] = useState({});
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSendingEod, setIsSendingEod] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [copiedShame, setCopiedShame] = useState(false);

  // Google OAuth tokens
  const [googleAccessToken, setGoogleAccessToken] = useState('');
  const [googleRefreshToken, setGoogleRefreshToken] = useState('');
  const [googleExpiresAt, setGoogleExpiresAt] = useState<number | null>(null);

  // Load profile and Google credentials on user load
  useEffect(() => {
    if (!user) {
      setTimeout(() => {
        setPartnerName('');
        setPartnerEmail('');
        setTwitterHandle('');
        setLinkedinUrl('');
        setUserName('');
        setGoogleAccessToken('');
        setGoogleRefreshToken('');
        setGoogleExpiresAt(null);
      }, 0);
      return;
    }

    // Load user-specific cached profile and Google tokens from localStorage as temporary fallback
    const backupName = localStorage.getItem(`partner_name_${user.id}`) || '';
    const backupEmail = localStorage.getItem(`partner_email_${user.id}`) || '';
    const backupTwitter = localStorage.getItem(`twitter_handle_${user.id}`) || '';
    const backupLinkedin = localStorage.getItem(`linkedin_url_${user.id}`) || '';
    const backupUserName = localStorage.getItem(`user_name_${user.id}`) || '';
    const backupToken = localStorage.getItem(`google_access_token_${user.id}`) || localStorage.getItem('google_access_token') || '';
    const backupRefresh = localStorage.getItem(`google_refresh_token_${user.id}`) || localStorage.getItem('google_refresh_token') || '';
    const backupExpires = localStorage.getItem(`google_expires_at_${user.id}`) || localStorage.getItem('google_expires_at') || null;

    setTimeout(() => {
      setPartnerName(backupName);
      setPartnerEmail(backupEmail);
      setTwitterHandle(backupTwitter);
      setLinkedinUrl(backupLinkedin);
      setUserName(backupUserName);
      setGoogleAccessToken(backupToken);
      setGoogleRefreshToken(backupRefresh);
      setGoogleExpiresAt(backupExpires ? Number(backupExpires) : null);
    }, 0);

    // Fetch from Supabase profiles table
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const fetchProfile = async () => {
        try {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data) {
            setPartnerName(data.partner_name || '');
            setPartnerEmail(data.partner_email || '');
            setTwitterHandle(data.twitter_handle || '');
            setLinkedinUrl(data.linkedin_url || '');
            setUserName(data.user_name || '');
            
            // Sync/overwrite the user-specific temporary cache in localStorage
            localStorage.setItem(`partner_name_${user.id}`, data.partner_name || '');
            localStorage.setItem(`partner_email_${user.id}`, data.partner_email || '');
            localStorage.setItem(`twitter_handle_${user.id}`, data.twitter_handle || '');
            localStorage.setItem(`linkedin_url_${user.id}`, data.linkedin_url || '');
            localStorage.setItem(`user_name_${user.id}`, data.user_name || '');

            if (!data.partner_name || !data.partner_email) {
              setTimeout(() => {
                setShowOnboarding(true);
              }, 0);
            }
          } else {
            // No profile found in Supabase
            if (!backupName || !backupEmail) {
              setTimeout(() => {
                setShowOnboarding(true);
              }, 0);
            }
          }
        } catch (err) {
          if (!backupName || !backupEmail) {
            setTimeout(() => {
              setShowOnboarding(true);
            }, 0);
          }
        }
      };
      fetchProfile();
    } else {
      if (!backupName || !backupEmail) {
        setTimeout(() => {
          setShowOnboarding(true);
        }, 0);
      }
    }
  }, [user]);

  // Check for shame overlay when habits and completions are loaded
  useEffect(() => {
    if (loading || !user || habits.length === 0 || completions.length === 0) return;

    const yesterdayStr = getOffsetDateString(todayStr, -1);
    const lastShamedDate = localStorage.getItem('last_shamed_date');

    if (lastShamedDate === yesterdayStr) {
      // Already shamed for yesterday
      return;
    }

    // Habits active yesterday
    const yesterdayDate = new Date(yesterdayStr + 'T23:59:59');
    const habitsYesterday = habits.filter(h => {
      const created = new Date(h.createdAt);
      return created <= yesterdayDate;
    });

    if (habitsYesterday.length === 0) return;

    // Missed habits yesterday
    const missedYesterday = habitsYesterday.filter(h => {
      return !completions.some(c => c.habitId === h.id && c.date === yesterdayStr && (c.status === 'completed' || c.status === 'skipped'));
    });

    if (missedYesterday.length > 0 && !showShameOverlay) {
      // Trigger shame asynchronously via setTimeout
      setTimeout(() => {
        setShowShameOverlay(true);
        shameTwitterClicked.current = false;
        shameLinkedinClicked.current = false;
        forceUpdate({});
      }, 0);
      
      // Generate shame post using Gemini API
      fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'shame',
          missedHabits: missedYesterday.map(h => h.name),
          userName: userName || user.email?.split('@')[0] || 'User'
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.text) {
          setShamePostText(data.text);
        } else {
          setShamePostText(`I failed to complete my daily habits (${missedYesterday.map(h => h.name).join(', ')}). Sincere apologies to my accountability partner! #lazy #Accounta`);
        }
      })
      .catch(err => {
        console.error('Error generating shame post:', err);
        setShamePostText(`I failed to complete my daily habits (${missedYesterday.map(h => h.name).join(', ')}). Sincere apologies to my accountability partner! #lazy #Accounta`);
      });
    }
  }, [habits, completions, loading, user, todayStr, showShameOverlay, userName]);

  // Load Google Identity Services (GSI) script on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('gsi-client-script')) {
      const script = document.createElement('script');
      script.id = 'gsi-client-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleConnectGmail = async () => {
    try {
      // 1. Retrieve Client ID directly from environment variable
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable is not defined. Please configure it in your environments.');
      }

      // 2. Ensure Google Identity Services script is loaded and initialized
      if (typeof window === 'undefined') return;

      const loadGSIScript = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          const googleObj = (window as any).google;
          if (googleObj && googleObj.accounts && googleObj.accounts.oauth2) {
            resolve(googleObj);
            return;
          }

          let script = document.getElementById('gsi-client-script') as HTMLScriptElement;
          if (!script) {
            script = document.createElement('script');
            script.id = 'gsi-client-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
          }

          const checkInterval = setInterval(() => {
            const g = (window as any).google;
            if (g && g.accounts && g.accounts.oauth2) {
              clearInterval(checkInterval);
              resolve(g);
            }
          }, 100);

          setTimeout(() => {
            clearInterval(checkInterval);
            const g = (window as any).google;
            if (g && g.accounts && g.accounts.oauth2) {
              resolve(g);
            } else {
              reject(new Error('Google Identity Services library took too long to load. Please try again.'));
            }
          }, 8000);
        });
      };

      const googleObj = await loadGSIScript();

      // 3. Initialize GSI OAuth 2.0 Token Client
      const tokenClient = googleObj.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/gmail.send',
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            alert('Failed to authorize Gmail: ' + (tokenResponse.error_description || tokenResponse.error));
            return;
          }

          const accessToken = tokenResponse.access_token;
          const expiresIn = tokenResponse.expires_in;
          const expiresAt = Date.now() + (expiresIn || 3600) * 1000;

          setGoogleAccessToken(accessToken);
          setGoogleExpiresAt(expiresAt);

          // Save standard keys and user-specific keys
          if (user) {
            localStorage.setItem(`google_access_token_${user.id}`, accessToken);
            localStorage.setItem(`google_expires_at_${user.id}`, String(expiresAt));
          }
          localStorage.setItem('google_access_token', accessToken);
          localStorage.setItem('google_expires_at', String(expiresAt));

          alert('Gmail connected successfully!');
        },
      });

      // 4. Trigger popup to request Access Token
      tokenClient.requestAccessToken({ prompt: 'consent' });

    } catch (err: any) {
      console.error('Error connecting to Gmail:', err);
      alert('Error initiating Gmail connection: ' + err.message);
    }
  };

  const handleSaveProfile = async (
    name: string,
    email: string,
    twitter: string,
    linkedin: string
  ) => {
    setPartnerName(name);
    setPartnerEmail(email);
    setTwitterHandle(twitter);
    setLinkedinUrl(linkedin);

    if (user) {
      localStorage.setItem(`partner_name_${user.id}`, name);
      localStorage.setItem(`partner_email_${user.id}`, email);
      localStorage.setItem(`twitter_handle_${user.id}`, twitter);
      localStorage.setItem(`linkedin_url_${user.id}`, linkedin);
    }

    const supabase = getSupabaseBrowserClient();
    if (supabase && user) {
      try {
        await supabase.from('profiles').upsert({
          user_id: user.id,
          partner_name: name,
          partner_email: email,
          twitter_handle: twitter,
          linkedin_url: linkedin,
          user_name: userName,
        });
      } catch (err) {
        console.warn('Could not save to Supabase profiles table. Using localStorage backup:', err);
      }
    }
  };

  const handleSimulateEod = async () => {
    if (!partnerEmail) {
      alert('Please set your accountability partner email first in Settings.');
      return;
    }

    setIsSendingEod(true);

    try {
      // 1. Gather stats for today
      const completedList = habits.filter(h => {
        return completions.some(c => c.habitId === h.id && c.date === todayStr && (c.status === 'completed' || !c.status));
      });

      const skippedList = habits.filter(h => {
        return completions.some(c => c.habitId === h.id && c.date === todayStr && c.status === 'skipped');
      });

      const missedList = habits.filter(h => {
        return !completions.some(c => c.habitId === h.id && c.date === todayStr && (c.status === 'completed' || c.status === 'skipped'));
      });

      console.log('[EOD Simulate] Total habits found:', habits.length);
      console.log('[EOD Simulate] Incomplete/missed habits count:', missedList.length);
      console.log('[EOD Simulate] Skipped habits count:', skippedList.length);

      // Force the shame overlay to appear immediately if there are missed habits
      if (missedList.length > 0) {
        console.log('[EOD Simulate] Missed habits detected! Reaching shame overlay lines.');
        shameOverlayRef.current = true;
        setShowShameOverlay(true);
        console.log('[EOD Simulate] showShameOverlay state is being set to true after EOD completes:', true);
        shameTwitterClicked.current = false;
        shameLinkedinClicked.current = false;
        setShamePostText('');
        forceUpdate({});
      }

      // Simultaneously fetch shame post asynchronously if there are missed habits
      if (missedList.length > 0) {
        fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'shame',
            missedHabits: missedList.map(h => h.name),
            userName: userName || user?.email?.split('@')[0] || 'User'
          })
        })
        .then(res => res.json())
        .then(data => {
          const generatedShameText = data.text || `I failed to complete my daily habits (${missedList.map(h => h.name).join(', ')}). Sincere apologies to my accountability partner! #AccountaShame #NoExcuses`;
          setShamePostText(generatedShameText);
          forceUpdate({});
        })
        .catch(err => {
          console.error('Error generating shame post during simulated EOD:', err);
          const fallbackText = `I failed to complete my daily habits (${missedList.map(h => h.name).join(', ')}). Sincere apologies to my accountability partner! #AccountaShame #NoExcuses`;
          setShamePostText(fallbackText);
          forceUpdate({});
        });
      }

      // Call send-report API asynchronously
      fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: googleAccessToken,
          refreshToken: googleRefreshToken,
          partnerName,
          partnerEmail,
          userName: userName || user?.email?.split('@')[0] || 'User',
          completedHabits: completedList,
          missedHabits: missedList,
          skippedHabits: skippedList
        })
      })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to send report.');
        }

        if (data.newAccessToken) {
          setGoogleAccessToken(data.newAccessToken);
          localStorage.setItem('google_access_token', data.newAccessToken);
        }

        alert('Daily scorecard report successfully sent to your partner!');
      })
      .catch((err) => {
        console.error(err);
        alert('Error sending EOD report: ' + err.message);
      })
      .finally(() => {
        setIsSendingEod(false);
      });

    } catch (err: any) {
      console.error(err);
      alert('Error initiating EOD simulation: ' + err.message);
      setIsSendingEod(false);
    }
  };

  const handleShameTwitterShare = () => {
    shameTwitterClicked.current = true;
    forceUpdate({});
    const hasTwitter = !!twitterHandle && twitterHandle.trim().length > 0;
    const hasLinkedin = !!linkedinUrl && linkedinUrl.trim().length > 0;
    const nextCanUnlock = (!hasTwitter || true) && (!hasLinkedin || shameLinkedinClicked.current);
    console.log('[Shame Overlay Debug] Twitter share clicked:', {
      twitterClicked: true,
      linkedinClicked: shameLinkedinClicked.current,
      canUnlock: nextCanUnlock
    });
    const cleanShameText = shamePostText.replace(/https?:\/\/[^\s]+/gi, '').trim();
    const text = encodeURIComponent(cleanShameText);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleShameLinkedinShare = () => {
    shameLinkedinClicked.current = true;
    forceUpdate({});
    const hasTwitter = !!twitterHandle && twitterHandle.trim().length > 0;
    const hasLinkedin = !!linkedinUrl && linkedinUrl.trim().length > 0;
    const nextCanUnlock = (!hasTwitter || shameTwitterClicked.current) && (!hasLinkedin || true);
    console.log('[Shame Overlay Debug] LinkedIn share clicked:', {
      twitterClicked: shameTwitterClicked.current,
      linkedinClicked: true,
      canUnlock: nextCanUnlock
    });
    const cleanShameText = shamePostText.replace(/https?:\/\/[^\s]+/gi, '').trim();
    const summary = encodeURIComponent(cleanShameText);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?summary=${summary}`, '_blank');
  };

  const handleCopyShamePost = async () => {
    try {
      const cleanShameText = shamePostText.replace(/https?:\/\/[^\s]+/gi, '').trim();
      await navigator.clipboard.writeText(cleanShameText);
      setCopiedShame(true);
      setTimeout(() => {
        setCopiedShame(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  useEffect(() => {
    if (showShameOverlay) {
      const hasTwitter = !!twitterHandle && twitterHandle.trim().length > 0;
      const hasLinkedin = !!linkedinUrl && linkedinUrl.trim().length > 0;
      const currentCanUnlock = (!hasTwitter || shameTwitterClicked.current) && (!hasLinkedin || shameLinkedinClicked.current);
      console.log('[Shame Overlay State Change]:', {
        twitterClicked: shameTwitterClicked.current,
        linkedinClicked: shameLinkedinClicked.current,
        canUnlock: currentCanUnlock
      });
    }
  }, [showShameOverlay, twitterHandle, linkedinUrl]);

  // Listen to Supabase auth status
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null);
      if (!user) {
        setLoading(false);
      }
    });

    // Subscribe to state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Redirect unauthenticated users to the login/signup page
  useEffect(() => {
    if (user === null) {
      window.location.href = '/login';
    }
  }, [user]);

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      setLoading(true);
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  };

  // Fetch initial data
  useEffect(() => {
    if (!user) return; // Wait until user is verified and loaded

    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch('/api/habits');
        if (response.ok) {
          const data = await response.json();
          setHabits(data.habits || []);
          setCompletions(data.completions || []);
        } else {
          const data = await response.json().catch(() => ({}));
          console.error('API responded with error:', data.error || response.statusText);
          setSyncError(data.error || `Server error: ${response.status}`);
          setHabits([]);
          setCompletions([]);
        }
      } catch (error: any) {
        console.error('Failed to fetch habits and completions:', error);
        setSyncError(`Failed to load tracker: ${error.message || error}`);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  // Sync theme to local storage and apply classes
  useEffect(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  }, []);

  // Generate 13-day window (12 normal days + 1 wider endpoint day = 13 dates)
  const numDaysToDisplay = 13;
  
  const getTimelineDays = () => {
    const days: string[] = [];
    // End view exactly at today shifted by offsetDays (no +1 placeholder column!)
    const endDateStr = getOffsetDateString(todayStr, -offsetDays);
    
    for (let i = numDaysToDisplay - 1; i >= 0; i--) {
      days.push(getOffsetDateString(endDateStr, -i));
    }
    return days;
  };

  const timelineDays = getTimelineDays();

  const handleShiftPast = () => setOffsetDays(prev => prev + 7);
  const handleShiftFuture = () => setOffsetDays(prev => Math.max(0, prev - 7));
  const handleResetTimeline = () => setOffsetDays(0);

  const updateCellStatus = async (habitId: string, dateStr: string, targetStatus: 'completed' | 'skipped' | 'empty') => {
    const completionId = `${habitId}_${dateStr}`;
    const originalCompletions = [...completions];

    // Optimistically update UI
    let updatedCompletions: Completion[] = [];
    if (targetStatus === 'empty') {
      updatedCompletions = completions.filter(c => c.id !== completionId);
    } else {
      const existsIndex = completions.findIndex(c => c.id === completionId);
      if (existsIndex >= 0) {
        updatedCompletions = [...completions];
        updatedCompletions[existsIndex] = {
          id: completionId,
          habitId,
          date: dateStr,
          status: targetStatus
        };
      } else {
        updatedCompletions = [
          ...completions,
          {
            id: completionId,
            habitId,
            date: dateStr,
            status: targetStatus
          }
        ];
      }
    }

    setCompletions(updatedCompletions);
    setSyncError(null);

    try {
      const response = await fetch('/api/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId,
          date: dateStr,
          status: targetStatus
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Server responded with status ${response.status}`);
      }
    } catch (error: any) {
      console.error('Failed to sync completion, reverting:', error);
      setSyncError(`Sync Error: ${error.message || error}`);
      setCompletions(originalCompletions); // Revert
    }
  };

  // Click-cycle skip handler (sequential single-click cycle: empty -> completed -> skipped -> empty)
  const handleToggleCell = async (habitId: string, dateStr: string, currentStatus: 'completed' | 'skipped' | 'empty') => {
    let targetStatus: 'completed' | 'skipped' | 'empty' = 'empty';

    if (currentStatus === 'empty') {
      targetStatus = 'completed';
    } else if (currentStatus === 'completed') {
      targetStatus = 'skipped';
    } else if (currentStatus === 'skipped') {
      targetStatus = 'empty';
    }

    await updateCellStatus(habitId, dateStr, targetStatus);
  };

  // Habit Actions
  const openCreateModal = () => {
    setModalName('');
    setModalEmoji('🍏');
    setModalColor('emerald');
    setEmojiSearch('');
    setCustomEmojiText('');
    setCustomEmojiError('');
    setModalError(null);
    setConfirmDelete(false);
    setActiveModal('create');
  };

  const openEditModal = (habit: Habit) => {
    setModalName(habit.name);
    setModalEmoji(habit.emoji);
    setModalColor(habit.color);
    setEmojiSearch('');
    setCustomEmojiText('');
    setCustomEmojiError('');
    setModalError(null);
    setConfirmDelete(false);
    setActiveModal({ type: 'edit', habit });
  };

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim()) return;

    // Validate emoji first
    const validatedEmoji = getFirstEmoji(modalEmoji);
    if (!validatedEmoji) {
      setCustomEmojiError('Please select or input a valid emoji.');
      return;
    }

    setSubmitting(true);
    setModalError(null);
    const isEdit = activeModal !== 'create' && activeModal !== null;
    const habitId = isEdit ? (activeModal as any).habit.id : undefined;

    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: habitId,
          name: modalName.trim(),
          emoji: validatedEmoji,
          color: modalColor
        })
      });

      const data = await response.json();
      if (response.ok) {
        if (data.success) {
          if (isEdit) {
            setHabits(prev => prev.map(h => h.id === habitId ? data.habit : h));
          } else {
            setHabits(prev => [...prev, data.habit]);
          }
          setActiveModal(null);
        } else {
          setModalError(data.error || 'Failed to save habit');
        }
      } else {
        setModalError(data.error || 'Failed to save habit');
      }
    } catch (error: any) {
      console.error('Failed to save habit:', error);
      setModalError(error.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    setSubmitting(true);
    setCustomEmojiError('');
    try {
      const response = await fetch(`/api/habits?id=${habitId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setHabits(prev => prev.filter(h => h.id !== habitId));
        setCompletions(prev => prev.filter(c => c.habitId !== habitId));
        setActiveModal(null);
      } else {
        const errData = await response.json().catch(() => ({}));
        setCustomEmojiError(errData.error || 'Failed to delete habit. Server responded with an error.');
      }
    } catch (error: any) {
      console.error('Failed to delete habit:', error);
      setCustomEmojiError(error.message || 'Network error occurred while deleting habit.');
    } finally {
      setSubmitting(false);
    }
  };

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm font-mono text-zinc-400">Verifying session...</p>
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        <p className="text-sm font-mono text-zinc-400">Redirecting to login...</p>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div id="onboarding_overlay" className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-neutral-100 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="flex justify-center items-center mb-6">
            <img 
              id="onboarding_brand_logo_full" 
              src="/Accounta_full_logo.png" 
              alt="Accounta" 
              className="h-20 w-auto object-contain" 
            />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Accountability Partner & Socials
          </h2>
          <p className="mt-2 text-sm font-semibold bg-[linear-gradient(to_right,#4285F4,#EA4335,#FBBC05,#34A853)] bg-clip-text text-transparent inline-block">
            Real consequences require a partner. Set yours up to begin.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-zinc-900 border border-zinc-800/80 py-8 px-6 shadow-xl rounded-2xl">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = (form.elements.namedItem('partner_name') as HTMLInputElement).value;
                const email = (form.elements.namedItem('partner_email') as HTMLInputElement).value;
                const twitter = (form.elements.namedItem('twitter_handle') as HTMLInputElement).value;
                const linkedin = (form.elements.namedItem('linkedin_url') as HTMLInputElement).value;

                if (!name.trim() || !email.trim()) {
                  setOnboardingError('An accountability partner is required — Accounta only works if someone is watching.');
                  return;
                }

                if (!twitter.trim() && !linkedin.trim()) {
                  setOnboardingError('At least one social handle (Twitter/X or LinkedIn) is mandatory.');
                  return;
                }

                setOnboardingError(null);
                await handleSaveProfile(name, email, twitter, linkedin);
                setShowOnboarding(false);
              }}
              className="space-y-5"
            >
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider font-mono">
                  Partner Name *
                </label>
                <input
                  name="partner_name"
                  type="text"
                  placeholder="e.g. John Doe"
                  className="block w-full px-3 py-2.5 border border-zinc-800 bg-zinc-950 rounded-xl text-sm placeholder-zinc-600 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider font-mono">
                  Partner Email *
                </label>
                <input
                  name="partner_email"
                  type="email"
                  placeholder="partner@example.com"
                  className="block w-full px-3 py-2.5 border border-zinc-800 bg-zinc-950 rounded-xl text-sm placeholder-zinc-600 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider font-mono">
                  Twitter/X Handle
                </label>
                <input
                  name="twitter_handle"
                  type="text"
                  placeholder="@yourhandle"
                  className="block w-full px-3 py-2.5 border border-zinc-800 bg-zinc-950 rounded-xl text-sm placeholder-zinc-600 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider font-mono">
                  LinkedIn URL
                </label>
                <input
                  name="linkedin_url"
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  className="block w-full px-3 py-2.5 border border-zinc-800 bg-zinc-950 rounded-xl text-sm placeholder-zinc-600 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {onboardingError && (
                <p id="onboarding_error" className="text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-lg font-mono">
                  ⚠️ {onboardingError}
                </p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-zinc-950 bg-white hover:bg-zinc-100 transition-all cursor-pointer shadow-md"
                >
                  Save & Get Started
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (showShameOverlay || shameOverlayRef.current) {
    const hasTwitter = !!twitterHandle && twitterHandle.trim().length > 0;
    const hasLinkedin = !!linkedinUrl && linkedinUrl.trim().length > 0;
    const canUnlock = (!hasTwitter || shameTwitterClicked.current) && (!hasLinkedin || shameLinkedinClicked.current);

    return (
      <div id="shame_overlay" className="fixed inset-0 bg-red-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-lg bg-zinc-950 border-2 border-red-500 rounded-2xl p-6 sm:p-8 text-center shadow-2xl relative">
          <div className="absolute top-4 right-4 bg-red-500/10 border border-red-500/20 text-red-500 font-mono text-[9px] px-2 py-0.5 rounded uppercase font-bold animate-pulse">
            Undismissable Warning
          </div>
          
          <span className="text-5xl block mb-4">🚨</span>
          <h2 className="text-3xl font-extrabold tracking-tight text-red-500 font-mono uppercase mb-2">
            SHAME PROTOCOL ACTIVE
          </h2>
          <p className="text-sm text-zinc-400 mb-6 max-w-sm mx-auto leading-relaxed">
            You failed to complete your habits yesterday. To unlock your tracker, you must publish your public shame post on {
              hasTwitter && hasLinkedin 
                ? 'both Twitter/X and LinkedIn' 
                : hasTwitter 
                  ? 'Twitter/X' 
                  : 'LinkedIn'
            }.
          </p>
 
          <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-4 text-left text-sm mb-6 max-h-48 overflow-y-auto font-mono text-zinc-300 leading-relaxed italic relative">
            {shamePostText ? (
              `"${shamePostText}"`
            ) : (
              <span className="flex items-center justify-center py-8 text-xs text-zinc-500 gap-2 font-sans not-italic">
                <RefreshCw className="w-4 h-4 animate-spin" />
                AI is crafting your bespoke shame report...
              </span>
            )}
          </div>

          <div className="mb-6">
            <p className="text-xl sm:text-2xl font-black tracking-wider bg-[linear-gradient(to_right,#4285F4,#EA4335,#FBBC05,#34A853)] bg-clip-text text-transparent inline-block">
              5-4-3-2-1-GO!!!
            </p>
          </div>
 
          <div className={`grid gap-4 mb-8 ${hasTwitter && hasLinkedin ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {hasTwitter && (
              <button
                onClick={handleShameTwitterShare}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  shameTwitterClicked.current 
                    ? 'bg-zinc-900 border border-zinc-800 text-emerald-400' 
                    : 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200'
                }`}
              >
                {shameTwitterClicked.current ? '✓ Shared to Twitter/X' : 'Share to Twitter/X'}
              </button>
            )}
 
            {hasLinkedin && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCopyShamePost}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    copiedShame 
                      ? 'bg-zinc-900 border border-emerald-500/30 text-emerald-400' 
                      : 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
                  }`}
                >
                  {copiedShame ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Shame Post
                    </>
                  )}
                </button>
                <button
                  onClick={handleShameLinkedinShare}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    shameLinkedinClicked.current 
                      ? 'bg-zinc-900 border border-zinc-800 text-emerald-400' 
                      : 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200'
                  }`}
                >
                  {shameLinkedinClicked.current ? '✓ Shared to LinkedIn' : 'Share to LinkedIn'}
                </button>
              </div>
            )}
          </div>
 
          <button
            disabled={!canUnlock}
            onClick={() => {
              const yesterdayStr = getOffsetDateString(todayStr, -1);
              localStorage.setItem('last_shamed_date', yesterdayStr);
              setShowShameOverlay(false);
              shameOverlayRef.current = false;
            }}
            className="w-full py-3 rounded-xl text-sm font-black tracking-wider uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-red-600 hover:bg-red-500 text-white"
          >
            {canUnlock 
              ? 'Forgive Me & Continue to Tracker' 
              : 'Share on Required Platforms to Unlock'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="app_root" 
      className={`min-h-screen ${isDarkMode ? 'bg-zinc-950 text-neutral-100' : 'bg-[#fafaf9] text-zinc-900'} font-sans transition-colors duration-200 select-none`}
    >
      {/* 1. SIMPLE & CLEAN HEADER NAVBAR */}
      <header 
        id="app_header" 
        className={`border-b ${isDarkMode ? 'border-zinc-900/80 bg-zinc-950/70' : 'border-neutral-200/50 bg-white/70'} backdrop-blur-md sticky top-0 z-40`}
      >
        <div className="max-w-6xl mx-auto px-4 py-3.5 sm:px-6 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <img 
              id="brand_logo_full" 
              src="/Accounta_full_logo.png" 
              alt="Accounta" 
              className="h-16 w-auto object-contain cursor-pointer transition-transform hover:scale-[1.02]" 
            />
          </div>

          {/* Header Action Items */}
          <div className="flex items-center gap-4">
            {user && (
              <div id="auth_user_info" className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">Signed In As</span>
                  <span className="text-xs font-medium text-zinc-300">{userName || user.email}</span>
                </div>
                <button
                  id="header_settings_btn"
                  onClick={() => setShowSettingsModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-800 text-zinc-300 transition-all cursor-pointer shadow-sm"
                  title="Accounta Settings"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Settings</span>
                </button>
                <button
                  id="sign_out_btn"
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 border border-zinc-800/80 hover:bg-zinc-800 text-zinc-300 transition-all cursor-pointer shadow-sm"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. MAIN HABIT TRACKING GRID */}
      <main className="max-w-6xl mx-auto px-4 py-10 sm:px-6">
        {syncError && (
          <div id="sync_error_alert" className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center justify-between gap-2 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-sm">⚠️</span>
              <span className="font-mono">{syncError}</span>
            </div>
            <button 
              onClick={() => setSyncError(null)}
              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-md transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
        
        {/* UPPER NAVIGATION BAR & ACTIONS */}
        <div id="grid_controls" className="mb-6 flex items-center justify-between">
          <button
            id="new_habit_top_btn"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-zinc-900 transition-all shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Habit
          </button>

          {/* Grid Navigation (weeks) */}
          <div className="flex items-center gap-1.5 bg-neutral-100/85 dark:bg-zinc-900/80 p-0.5 rounded-lg border border-neutral-200/50 dark:border-zinc-800/60">
            <button
              id="nav_shift_past"
              onClick={handleShiftPast}
              className="p-1.5 rounded hover:bg-white dark:hover:bg-zinc-800 text-neutral-500 dark:text-neutral-400 transition"
              title="Go back"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold uppercase px-2 text-neutral-500 dark:text-zinc-400">
              {offsetDays === 0 ? 'Latest' : `${offsetDays}d ago`}
            </span>
            <button
              id="nav_shift_future"
              onClick={handleShiftFuture}
              disabled={offsetDays === 0}
              className={`p-1.5 rounded text-neutral-500 dark:text-neutral-400 transition ${offsetDays === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white dark:hover:bg-zinc-800'}`}
              title="Go forward"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {offsetDays > 0 && (
              <button
                id="nav_reset"
                onClick={handleResetTimeline}
                className="text-[9px] px-2 py-1 font-bold hover:bg-white dark:hover:bg-zinc-800 rounded text-emerald-600 dark:text-emerald-400 font-mono transition"
              >
                Today
              </button>
            )}
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div id="loading_state" className="py-24 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-neutral-400 animate-spin" />
            <p className="text-xs font-mono text-neutral-400">Loading tracker grid...</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 px-1 animate-fade-in">
              <p className="text-xs text-neutral-500 dark:text-zinc-400 leading-relaxed max-w-xl">
                Tip: Double-click to skip a day without breaking your streak &mdash; for sick days, holidays, or rest days. Don&apos;t abuse this or your accountability partner will know.
              </p>
              <div className="flex items-center gap-1.5 shrink-0 select-none">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-600 dark:text-zinc-400 bg-neutral-100 dark:bg-zinc-900 border border-neutral-200/60 dark:border-zinc-800/80 px-2.5 py-1 rounded-md">
                  M = Mark, S = Skip, U = Unmark
                </span>
              </div>
            </div>

            <div 
              id="tracker_container" 
            className={`border ${isDarkMode ? 'border-zinc-900 bg-zinc-950/30' : 'border-neutral-200 bg-white'} rounded-2xl overflow-hidden shadow-sm`}
          >
            <div className="w-full overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="min-w-[1020px] flex flex-col">
                
                {/* GRID HEADER: CALENDAR DAYS */}
                <div 
                  id="grid_header" 
                  className={`flex items-stretch border-b ${isDarkMode ? 'border-zinc-900 bg-zinc-950/40' : 'border-neutral-200/60 bg-neutral-50/50'} py-4`}
                >
                  {/* Left: Column Name label */}
                  <div className="w-[220px] pl-6 flex items-center shrink-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-400 font-mono">
                      Habits ({habits.length})
                    </span>
                  </div>

                  {/* Middle: Grid Days */}
                  <div className="flex-1 pr-4">
                    <div 
                      className="grid grid-cols-14 gap-0" 
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}
                    >
                      {timelineDays.map((dateStr, idx) => {
                        const dateObj = new Date(dateStr + 'T12:00:00');
                        const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' });
                        const dayNum = dateObj.getDate();
                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2);
                        const isToday = dateStr === todayStr;
                        const isLast = idx === timelineDays.length - 1;

                        return (
                          <div 
                            key={dateStr} 
                            className={`flex flex-col items-center justify-center text-center w-full ${isLast ? 'col-span-2' : 'col-span-1'}`}
                          >
                            {isToday ? (
                              <div 
                                id={`today_indicator_${dateStr}`} 
                                className="flex flex-col items-center justify-center py-1.5 w-full rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                                title="Today"
                              >
                                <span className="text-[8px] leading-none uppercase tracking-wider text-zinc-600 dark:text-zinc-400 font-extrabold font-mono">Today</span>
                                <span className="text-xs font-black mt-1 text-zinc-950 dark:text-neutral-50">{dayNum}</span>
                                <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400 font-bold mt-0.5 uppercase">{dayName}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-1.5 w-full">
                                <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">{monthStr}</span>
                                <span className={`text-xs font-black mt-1 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-950'}`}>{dayNum}</span>
                                <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400 font-semibold mt-0.5 uppercase">{dayName}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Streak Column label */}
                  <div className="w-[240px] pr-6 shrink-0 flex items-center justify-between pl-4 border-l border-neutral-200/40 dark:border-zinc-800/40">
                    <div className="w-1/3 text-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-400 font-mono">Current</span>
                    </div>
                    <div className="w-1/3 text-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-400 font-mono">Longest</span>
                    </div>
                    <div className="w-1/3 text-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-400 font-mono">Total</span>
                    </div>
                  </div>
                </div>

                {/* GRID BODY: HABITS ROWS */}
                <div id="grid_body" className="flex flex-col">
                  <AnimatePresence initial={false}>
                    {habits.map((habit) => {
                      // Calculate habit statistics
                      const habitCompletions = completions
                        .filter(c => c.habitId === habit.id && (c.status === 'completed' || c.status === 'skipped'))
                        .map(c => c.date);
                      const currentStreak = calculateCurrentStreak(habitCompletions, todayStr);
                      const longestStreak = calculateLongestStreak(habitCompletions);
                      
                      const onlyCompletedCompletions = completions
                        .filter(c => c.habitId === habit.id && (c.status === 'completed' || !c.status));
                      const totalCount = onlyCompletedCompletions.length;
                      
                      const habitColor = COLOR_OPTIONS[habit.color] || COLOR_OPTIONS.emerald;

                      return (
                        <motion.div
                          key={habit.id}
                          id={`habit_row_${habit.id}`}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-stretch group hover:bg-neutral-50/40 dark:hover:bg-zinc-900/10 py-0"
                        >
                          {/* Left Column: Emoji + Habit Name */}
                          <div className="w-[220px] pl-6 flex items-center pr-3 shrink-0 gap-3 relative">
                            {/* Edit Cog button visible on hover */}
                            <button
                              id={`edit_habit_btn_${habit.id}`}
                              onClick={() => openEditModal(habit)}
                              className="absolute left-1.5 p-1 rounded-md text-zinc-400 dark:text-zinc-600 hover:text-zinc-800 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-zinc-900 transition opacity-0 group-hover:opacity-100"
                              title="Edit habit settings"
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </button>

                            {/* Habit Emoji & Name */}
                            <span className="text-xl select-none shrink-0">{habit.emoji}</span>
                            <span className="text-sm font-black truncate text-zinc-950 dark:text-neutral-50 select-none tracking-tight">
                              {habit.name}
                            </span>
                          </div>

                          {/* Middle Column: Continuous Timeline Grid */}
                          <div className="flex-1 pr-4">
                            <div 
                              className="grid grid-cols-14 gap-0 overflow-hidden bg-neutral-100/10 dark:bg-zinc-900/5"
                              style={{ display: 'grid', gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}
                            >
                              {timelineDays.map((dateStr, idx) => {
                                const completionId = `${habit.id}_${dateStr}`;
                                const comp = completions.find(c => c.id === completionId);
                                const isCompleted = comp ? comp.status === 'completed' : false;
                                const isSkipped = comp ? comp.status === 'skipped' : false;
                                const isToday = dateStr === todayStr;
                                const isLast = idx === timelineDays.length - 1;

                                const { index, length } = getStreakInfoAtDate(habitCompletions, dateStr);
                                const cellStyle = getCellStyle(habit.color, isCompleted, index, length, isDarkMode);
                                
                                let finalCellStyle = cellStyle;
                                if (isSkipped) {
                                  // Use empty/uncompleted styling for skipped day base grid cell
                                  finalCellStyle = getCellStyle(habit.color, false, 0, 0, isDarkMode);
                                }

                                const roundedClass = (isCompleted || isSkipped) 
                                  ? getRoundedCornersClass(dateStr, habitCompletions)
                                  : 'rounded-none hover:rounded-lg';

                                const yesterdayDateStr = getOffsetDateString(dateStr, -1);
                                const prevCompletedOrSkipped = completions.some(
                                  c => c.habitId === habit.id && c.date === yesterdayDateStr && (c.status === 'completed' || c.status === 'skipped')
                                );
                                
                                let prevBgColor = '';
                                if (prevCompletedOrSkipped) {
                                  const { index: prevIndex, length: prevLength } = getStreakInfoAtDate(habitCompletions, yesterdayDateStr);
                                  const prevStyle = getCellStyle(habit.color, true, prevIndex, prevLength, isDarkMode);
                                  prevBgColor = prevStyle.backgroundColor || '';
                                } else {
                                  // Default to starting color of the habit
                                  const defaultStyle = getCellStyle(habit.color, true, 0, 1, isDarkMode);
                                  prevBgColor = defaultStyle.backgroundColor || '';
                                }

                                const spec = COLOR_MAP[habit.color] || COLOR_MAP.emerald;
                                const habitColorHex = `hsl(${spec.hue}, ${spec.saturation}%, ${isDarkMode ? spec.lightnessDark : spec.lightnessLight}%)`;

                                return (
                                  <div 
                                    key={dateStr} 
                                    className={`${isLast ? 'col-span-2 h-full' : 'aspect-square'} w-full relative`}
                                  >
                                    <button
                                      id={`cell_${habit.id}_${dateStr}`}
                                      onClick={() => handleToggleCell(habit.id, dateStr, isCompleted ? 'completed' : isSkipped ? 'skipped' : 'empty')}
                                      style={{
                                        ...finalCellStyle,
                                        '--habit-color': habitColorHex,
                                      } as React.CSSProperties}
                                      className={`w-full h-full transition-all duration-300 ease-in-out outline-none cursor-pointer border-0 relative flex items-center justify-center group/cell
                                        ${roundedClass}
                                        ${isCompleted 
                                          ? 'hover:brightness-[1.08] shadow-[0_1px_2px_rgba(0,0,0,0.03)]' 
                                          : 'hover:bg-neutral-200/60 dark:hover:bg-zinc-800/80'
                                        }
                                        ${isToday 
                                          ? 'ring-2 ring-zinc-500/50 dark:ring-zinc-400/50 ring-inset z-10' 
                                          : ''
                                        }
                                        hover:!bg-black border border-transparent hover:!border-[var(--habit-color)]
                                      `}
                                      title={`${habit.name}: ${isCompleted ? 'Completed' : isSkipped ? 'Skipped' : 'Not completed'} on ${dateStr}`}
                                    >
                                      {/* Skipped triangle overlay */}
                                      {isSkipped && (
                                        <div 
                                          className="group-hover/cell:opacity-0 transition-opacity duration-200 absolute inset-0"
                                          style={{
                                            backgroundColor: prevBgColor,
                                            clipPath: 'polygon(0% 0%, 0% 100%, 100% 100%)',
                                          }}
                                        />
                                      )}

                                      {/* Action letter on hover */}
                                      <span 
                                        className="opacity-0 group-hover/cell:opacity-100 absolute inset-0 flex items-center justify-center font-bold text-xs transition-opacity duration-200 select-none pointer-events-none"
                                        style={{ color: habitColorHex }}
                                      >
                                        {isCompleted ? 'S' : isSkipped ? 'U' : 'M'}
                                      </span>

                                      {/* Normal dot indicators */}
                                      <span className="group-hover/cell:opacity-0 transition-opacity duration-200">
                                        {isToday && !isCompleted && !isSkipped && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 dark:bg-zinc-400 transition-all duration-300" />
                                        )}
                                      </span>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Right Column: Key Statistics columns */}
                          <div className="w-[240px] pr-6 shrink-0 flex items-center justify-between pl-4 border-l border-neutral-200/40 dark:border-zinc-800/40">
                            {/* Current Streak badge */}
                            <div className="w-1/3 flex justify-center">
                              {currentStreak > 0 ? (
                                <span className={`px-2.5 py-0.5 rounded-full text-xs ${habitColor.badgeClass}`}>
                                  {currentStreak}d
                                </span>
                              ) : (
                                <span className="text-zinc-400 dark:text-zinc-600 font-bold text-xs font-mono">-</span>
                              )}
                            </div>

                            {/* Longest Streak badge */}
                            <div className="w-1/3 flex justify-center">
                              {longestStreak > 0 ? (
                                currentStreak === longestStreak ? (
                                  <span className={`px-2.5 py-0.5 rounded-full text-xs ${habitColor.badgeClass}`}>
                                    {longestStreak}d
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 font-mono">
                                    {longestStreak}d
                                  </span>
                                )
                              ) : (
                                <span className="text-zinc-400 dark:text-zinc-600 font-bold text-xs font-mono">-</span>
                              )}
                            </div>

                            {/* Total Completion count */}
                            <div className="w-1/3 flex justify-center">
                              {totalCount > 0 ? (
                                <span className="text-xs font-black text-zinc-950 dark:text-neutral-100 font-mono">
                                  {totalCount}
                                </span>
                              ) : (
                                <span className="text-zinc-400 dark:text-zinc-600 font-bold text-xs font-mono">-</span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* SUMMARY ROW */}
                  {habits.length > 0 && (
                    <div 
                      id="summary_row"
                      className={`flex items-stretch py-3 border-t ${isDarkMode ? 'border-zinc-900 bg-zinc-950/25' : 'border-neutral-200/50 bg-neutral-50/25'}`}
                    >
                      {/* Left Column: Label */}
                      <div className="w-[220px] pl-6 flex items-center pr-3 shrink-0 relative">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-zinc-500 font-mono select-none">
                          Completed
                        </span>
                      </div>

                      {/* Middle Column: Continuous Timeline Grid */}
                      <div className="flex-1 pr-4">
                        <div 
                          className="grid grid-cols-14 gap-0"
                          style={{ display: 'grid', gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}
                        >
                          {timelineDays.map((dateStr, idx) => {
                            const isLast = idx === timelineDays.length - 1;

                            // Calculate daily completion stats
                            const completedCount = completions.filter(
                              c => c.date === dateStr && (c.status === 'completed' || !c.status) && habits.some(h => h.id === c.habitId)
                            ).length;
                            const totalPossible = habits.length;

                            return (
                              <div 
                                key={`summary_${dateStr}`} 
                                className={`${isLast ? 'col-span-2 h-full' : 'aspect-square'} w-full flex items-center justify-center`}
                              >
                                <div
                                  id={`summary_cell_${dateStr}`}
                                  className="w-full h-full flex items-center justify-center text-sm font-semibold text-zinc-800 dark:text-zinc-100 font-sans select-none"
                                  title={`${completedCount} of ${totalPossible} habits completed on ${dateStr}`}
                                >
                                  {completedCount}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Column: Spacer to align with stats */}
                      <div className="w-[240px] pr-6 shrink-0 border-l border-neutral-200/40 dark:border-zinc-800/40" />
                    </div>
                  )}

                  {/* EMPTY BOARD STATE */}
                  {habits.length === 0 && (
                    <div id="empty_board" className="py-24 text-center flex flex-col items-center justify-center gap-3">
                      <span className="text-3xl">🌱</span>
                      <h3 className="font-semibold text-neutral-800 dark:text-neutral-200">No habits added yet</h3>
                      <p className="text-xs text-neutral-400 dark:text-zinc-500 max-w-xs mx-auto">
                        Create a habit to begin tracking daily streaks in a clean, minimalist visual grid.
                      </p>
                      <button
                        id="empty_create_btn"
                        onClick={openCreateModal}
                        className="mt-2 flex items-center gap-1 px-4 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 dark:bg-neutral-100 text-white dark:text-zinc-900 hover:opacity-90 transition shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create My First Habit
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
          </>
        )}
      </main>

      <footer className="w-full py-8 text-center text-xs text-zinc-500 dark:text-zinc-500 space-y-1">
        <p className="font-semibold bg-[linear-gradient(to_right,#4285F4,#EA4335,#FBBC05,#34A853)] bg-clip-text text-transparent inline-block">5-4-3-2-1 Go! • 1% better every day</p>
        <br />
        <p className="font-semibold bg-[linear-gradient(to_right,#4285F4,#EA4335,#FBBC05,#34A853)] bg-clip-text text-transparent inline-block">Finally get things done — change your life, one habit at a time.</p>
        <p>Made with ❤️ by Arav Jain</p>
      </footer>

      {/* 3. ULTRA CLEAN DIALOG MODAL (For creation / deletion) */}
      <AnimatePresence>
        {activeModal && (
          <div id="modal_overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 dark:bg-black/60 backdrop-blur-sm">
            <motion.div
              id="modal_container"
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.1 }}
              className={`w-full max-w-sm rounded-xl border p-5 shadow-xl ${isDarkMode ? 'border-zinc-800 bg-zinc-950 text-neutral-100' : 'border-neutral-200 bg-white text-zinc-900'}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-400 dark:text-zinc-500">
                  {activeModal === 'create' ? 'Add new habit' : 'Edit habit'}
                </h3>
                <button
                  id="close_modal"
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveHabit} className="space-y-4">
                {modalError && (
                  <div id="modal_error_alert" className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg flex gap-2 items-center">
                    <span>⚠️ {modalError}</span>
                  </div>
                )}
                {/* Habit Name input */}
                <div className="space-y-1">
                  <label htmlFor="habit_name" className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500 font-mono">
                    Name
                  </label>
                  <input
                    id="habit_name"
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Read, Workout, Code"
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-neutral-100 focus:border-zinc-700' : 'bg-neutral-50 border-neutral-200 text-zinc-900 focus:border-neutral-400'}`}
                  />
                </div>

                {/* Improved Emoji Picker */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500 font-mono">
                      Emoji Icon
                    </label>
                    {/* Live Preview */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400 dark:text-zinc-500 font-medium font-mono uppercase tracking-wider">Selected:</span>
                      <span id="selected_emoji_preview" className="text-xl px-2 py-0.5 rounded bg-neutral-100 dark:bg-zinc-900 border border-neutral-200/40 dark:border-zinc-800/40 shadow-sm font-sans select-none">
                        {modalEmoji}
                      </span>
                    </div>
                  </div>

                  {/* 1. Search field */}
                  <div className="relative">
                    <input
                      id="emoji_search_input"
                      type="text"
                      placeholder="Search emojis... (e.g. run, book, food)"
                      value={emojiSearch}
                      onChange={(e) => setEmojiSearch(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none transition ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-neutral-100 focus:border-zinc-700' : 'bg-neutral-50 border-neutral-200 text-zinc-900 focus:border-neutral-400'}`}
                    />
                  </div>

                  {/* 2. Popular / Filtered Emoji Grid */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500 font-mono block">
                      {emojiSearch ? 'Search Results' : 'Popular Emojis'}
                    </span>
                    <div className="grid grid-cols-8 gap-1.5 p-2 rounded-lg bg-neutral-50 dark:bg-zinc-900/30 border border-neutral-200/40 dark:border-zinc-800/40 max-h-24 overflow-y-auto">
                      {(emojiSearch ? filteredEmojis : POPULAR_EMOJIS).map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          id={`emoji_btn_${emoji}`}
                          onClick={() => {
                            setModalEmoji(emoji);
                            setCustomEmojiError('');
                          }}
                          className={`text-lg p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-zinc-800 transition ${modalEmoji === emoji ? 'bg-neutral-200 dark:bg-zinc-800 scale-105 border border-neutral-400/40 dark:border-zinc-600/40' : ''}`}
                        >
                          {emoji}
                        </button>
                      ))}
                      {(emojiSearch && filteredEmojis.length === 0) && (
                        <div className="col-span-8 py-3 text-center text-xs text-neutral-400 dark:text-zinc-500">
                          No matching emojis found
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Custom Emoji Input */}
                  <div className="space-y-1">
                    <label htmlFor="custom_emoji_input" className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500 font-mono flex justify-between">
                      <span>Or enter your own emoji</span>
                      <span className="text-[9px] font-normal lowercase text-neutral-400 dark:text-zinc-500">(Win + . or Ctrl + Cmd + Space)</span>
                    </label>
                    <input
                      id="custom_emoji_input"
                      type="text"
                      placeholder="Type or paste any emoji..."
                      value={customEmojiText}
                      onChange={(e) => handleCustomEmojiChange(e.target.value)}
                      className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none transition ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-neutral-100 focus:border-zinc-700' : 'bg-neutral-50 border-neutral-200 text-zinc-900 focus:border-neutral-400'}`}
                    />
                    {customEmojiError && (
                      <p id="custom_emoji_error" className="text-[10px] text-red-500 font-semibold mt-0.5">
                        ⚠️ {customEmojiError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Color Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-zinc-500 font-mono">
                    Color Accent
                  </label>
                  <div className="flex flex-wrap gap-2.5 p-1">
                    {Object.entries(COLOR_OPTIONS).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        id={`color_btn_${key}`}
                        onClick={() => setModalColor(key)}
                        className={`w-6 h-6 rounded-full ${config.bgClass} flex items-center justify-center transition-all ${modalColor === key ? 'ring-2 ring-offset-2 ring-zinc-400 dark:ring-offset-zinc-950 scale-110' : 'opacity-85 hover:opacity-100'}`}
                        title={config.name}
                      >
                        {modalColor === key && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="pt-3 border-t border-neutral-100 dark:border-zinc-900 flex items-center justify-between">
                  {/* Delete (Edit mode only) */}
                  {activeModal !== 'create' ? (
                    confirmDelete ? (
                      <div className="flex items-center gap-1.5" id="delete_confirmation_container">
                        <span className="text-[10px] font-bold text-rose-500 animate-pulse uppercase font-mono">Confirm?</span>
                        <button
                          type="button"
                          id="confirm_delete_habit_btn"
                          onClick={() => {
                            handleDeleteHabit((activeModal as any).habit.id);
                            setConfirmDelete(false);
                          }}
                          disabled={submitting}
                          className="px-2.5 py-1.5 text-xs font-bold rounded bg-rose-600 text-white hover:bg-rose-700 transition disabled:opacity-50"
                        >
                          Yes, Delete
                        </button>
                        <button
                          type="button"
                          id="cancel_delete_habit_btn"
                          onClick={() => setConfirmDelete(false)}
                          disabled={submitting}
                          className="px-2 py-1.5 text-xs font-semibold rounded border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-900 transition disabled:opacity-50 text-neutral-600 dark:text-zinc-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        id="delete_habit_btn"
                        onClick={() => setConfirmDelete(true)}
                        disabled={submitting}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded text-red-500 hover:bg-red-500/10 transition disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="cancel_modal"
                      onClick={() => setActiveModal(null)}
                      disabled={submitting}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-900 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="save_modal"
                      disabled={submitting}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 dark:bg-neutral-100 text-white dark:text-zinc-900 hover:opacity-90 transition disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : activeModal === 'create' ? 'Create' : 'Save'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. ACCOUNTA SETTINGS MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <div id="settings_modal_overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 dark:bg-black/60 backdrop-blur-sm">
            <motion.div
              id="settings_modal_container"
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 text-neutral-100 p-5 shadow-xl space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400">
                  Accounta Settings
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form & Configuration */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                    Accountability Partner Name
                  </label>
                  <input
                    id="settings_partner_name"
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-neutral-100 text-sm outline-none"
                    placeholder="Partner name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                    Accountability Partner Email
                  </label>
                  <input
                    id="settings_partner_email"
                    type="email"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-neutral-100 text-sm outline-none"
                    placeholder="partner@example.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                    Twitter/X Handle
                  </label>
                  <input
                    id="settings_twitter"
                    type="text"
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-neutral-100 text-sm outline-none"
                    placeholder="@yourhandle"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                    LinkedIn URL
                  </label>
                  <input
                    id="settings_linkedin"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-neutral-100 text-sm outline-none"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                {/* Google Gmail Connection Status */}
                <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
                      Gmail Integration
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${googleAccessToken ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {googleAccessToken ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Required to automatically email habit scorecards to your partner.
                  </p>
                  {!googleAccessToken ? (
                    <button
                      type="button"
                      onClick={handleConnectGmail}
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-100 transition-all cursor-pointer text-center"
                    >
                      Connect Gmail
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectGmail}
                      className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold border border-zinc-800 hover:bg-zinc-900 text-zinc-400 transition-all cursor-pointer text-center"
                    >
                      Reconnect Gmail Account
                    </button>
                  )}
                </div>

                {/* Actions / Simulation */}
                <div className="pt-2 border-t border-zinc-900 space-y-3">
                  <button
                    type="button"
                    disabled={isSendingEod}
                    onClick={handleSimulateEod}
                    className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSendingEod ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Generating & Emailing Report...
                      </>
                    ) : (
                      'Simulate End of Day'
                    )}
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSettingsModal(false)}
                      className="flex-1 py-2 px-3 rounded-lg text-xs border border-zinc-800 hover:bg-zinc-900 transition text-zinc-400 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleSaveProfile(partnerName, partnerEmail, twitterHandle, linkedinUrl);
                        setShowSettingsModal(false);
                      }}
                      className="flex-1 py-2 px-3 rounded-lg text-xs bg-white text-zinc-950 hover:bg-zinc-100 transition font-semibold"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
