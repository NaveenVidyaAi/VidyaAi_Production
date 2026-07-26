import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";
import Icon from "../components/Icon";
import { scienceWorld, seededLeaders } from "../data/gameContent";

const readProgress = () => {
  try {
    return JSON.parse(localStorage.getItem("vidyaai_game_progress") || "{}");
  } catch {
    return {};
  }
};

const burst = Array.from({ length: 16 }, (_, index) => ({
  id: index,
  x: Math.cos((index / 16) * Math.PI * 2) * (80 + (index % 3) * 22),
  y: Math.sin((index / 16) * Math.PI * 2) * (80 + (index % 4) * 18),
  color: ["#ffd166", "#ff7a59", "#5eead4", "#9f8cff"][index % 4],
}));

const subjects = [
  { id: "science", label: "विज्ञान", icon: "⚗", available: true },
  { id: "math", label: "गणित", icon: "∑", available: false },
  { id: "social-science", label: "सामाजिक विज्ञान", icon: "◈", available: false },
  { id: "hindi", label: "हिंदी", icon: "अ", available: false },
];

const answerSparkles = Array.from({ length: 9 }, (_, index) => ({
  id: index,
  x: Math.cos((index / 9) * Math.PI * 2) * (45 + (index % 2) * 22),
  y: Math.sin((index / 9) * Math.PI * 2) * (45 + (index % 3) * 14),
}));

const prepareChapterForPlay = (chapter) => {
  const startingShift = Math.floor(Math.random() * 4);
  return {
    ...chapter,
    questions: chapter.questions.map((question, questionPosition) => {
      const shift = (startingShift + questionPosition) % question.options.length;
      return {
        ...question,
        options: [...question.options.slice(shift), ...question.options.slice(0, shift)],
        answer: (question.answer - shift + question.options.length) % question.options.length,
      };
    }),
  };
};

function GameGlyph({ type, size = 32, className = "" }) {
  const art = {
    arena: <><path d="M7 9.5h10a4.5 4.5 0 0 1 4.3 5.8l-1 3.2a2 2 0 0 1-3.3.8l-2.1-1.8H9.1L7 19.3a2 2 0 0 1-3.3-.8l-1-3.2A4.5 4.5 0 0 1 7 9.5Z" fill="currentColor"/><path d="M8 12v4M6 14h4M16.5 13h.01M18.5 15h.01" stroke="#fff"/><path d="m9 7 3-3 3 3" stroke="#ffd95c"/></>,
    reaction: <><path d="M9 3h6M10 3v6l-5 8.5A2.3 2.3 0 0 0 7 21h10a2.3 2.3 0 0 0 2-3.5L14 9V3" fill="currentColor"/><path d="M7.4 16h9.2" stroke="#fff"/><circle cx="10" cy="14" r="1" fill="#ffe26f"/><circle cx="14.5" cy="17.5" r="1.2" fill="#fff"/></>,
    potion: <><path d="M8 3h8M9.5 3v7l-4 6.5A3 3 0 0 0 8 21h8a3 3 0 0 0 2.5-4.5l-4-6.5V3" fill="currentColor"/><path d="M7.2 16c2.4-1.5 4.6 1.7 9.8 0" stroke="#fff"/><circle cx="11" cy="13" r="1" fill="#faff9d"/></>,
    life: <><path d="M20.5 4.2C12 4 6.2 7.6 5.5 13.4c-.5 4.2 3 7.2 6.7 5.6 5-2.1 6.8-8.6 8.3-14.8Z" fill="currentColor"/><path d="M4 21c2.2-5.5 6.8-9.3 12.4-12" stroke="#fff"/><path d="M10.5 14.2 9 10.8M13.5 11.6l3.1.3" stroke="#d9ff9b"/></>,
    boss: <><path d="m5 8-2-5 5 3 4-4 4 4 5-3-2 5 2 4-3 8H6l-3-8 2-4Z" fill="currentColor"/><path d="M7.5 12.5 10 14l-2.5 1.5M16.5 12.5 14 14l2.5 1.5" stroke="#fff"/><path d="M9 18h6" stroke="#ffd95c"/></>,
    gem: <><path d="m12 2 7 5-2.5 11L12 22l-4.5-4L5 7l7-5Z" fill="currentColor"/><path d="m5 7 7 4 7-4M12 11v11" stroke="#fff"/><path d="m9 5 3 6 3-6" stroke="#ffe47b"/></>,
    flame: <><path d="M13 2c1 5-3 5.5-1.5 9 1-1 2-2.2 2.2-3.8 3.3 2.6 5 5.3 3.8 8.7A6 6 0 0 1 6 16c-1.4-4 1.4-7.1 4.4-9.8.1 2.2.8 3 1.4 3.5C10.7 6.5 12 4.2 13 2Z" fill="currentColor"/><path d="M12 20c-2.4-1.4-2.4-4.1 0-6 2.4 1.9 2.4 4.6 0 6Z" fill="#ffe37a"/></>,
    medal: <><path d="m7 3 3 7h4l3-7M12 9a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" fill="currentColor"/><path d="m12 12 1.2 2.2 2.5.4-1.8 1.8.4 2.5-2.3-1.2-2.3 1.2.4-2.5-1.8-1.8 2.5-.4L12 12Z" fill="#fff"/></>,
  }[type] || null;
  return <svg className={`gz-game-glyph ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{art}</svg>;
}

function GameHeader({ player, totalXp, onLeaderboard, onAchievements, soundOn, onSoundToggle }) {
  const navigate = useNavigate();
  const level = Math.floor(totalXp / 500) + 1;
  const levelProgress = (totalXp % 500) / 5;
  return (
    <header className="gz-header">
      <button className="gz-brand" type="button" onClick={() => navigate("/dashboard")} aria-label="Back to student dashboard">
        <span className="gz-brand-mark">V</span>
        <span><strong>VidyaAI</strong><small>खेल क्षेत्र</small></span>
      </button>
      <div className="gz-header-level" aria-label={`खिलाड़ी स्तर ${level}`}>
        <span><GameGlyph type="gem" size={18} /><b>लेवल {level}</b><small>{totalXp % 500}/500 XP</small></span>
        <i><b style={{ width: `${levelProgress}%` }} /></i>
      </div>
      <div className="gz-player">
        <button type="button" className="gz-sound-toggle" onClick={onSoundToggle} aria-label={soundOn ? "गेम की आवाज़ बंद करें" : "गेम की आवाज़ चालू करें"}>
          <Icon name={soundOn ? "volume" : "volumeOff"} size={17} />
        </button>
        <button type="button" className="gz-league-toggle" onClick={onLeaderboard} aria-label="लीडरबोर्ड खोलें"><GameGlyph type="medal" size={18} /><b>लीग</b></button>
        <button type="button" className="gz-trophy-toggle" onClick={onAchievements} aria-label="ट्रॉफी रूम खोलें"><GameGlyph type="boss" size={18} /><b>ट्रॉफी</b></button>
        <span className="gz-xp-pill"><GameGlyph type="gem" size={17} /><b>{totalXp.toLocaleString()}</b><small>XP</small></span>
        <span className="gz-player-avatar">{player.charAt(0).toUpperCase()}</span>
      </div>
    </header>
  );
}

function Leaderboard({ player, totalXp, onClose }) {
  const [league, setLeague] = useState("कक्षा");
  const leaders = useMemo(() => {
    const all = [...seededLeaders, { name: player, xp: totalXp, streak: readProgress().streak || 1, avatar: player.slice(0, 2).toUpperCase(), current: true }];
    return all.sort((a, b) => b.xp - a.xp);
  }, [player, totalXp]);

  return (
    <motion.div className="gz-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.section className="gz-leaderboard" initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }} onClick={(event) => event.stopPropagation()}>
        <div className="gz-lb-head">
          <div><span>साप्ताहिक लीग</span><h2>विज्ञान विजेता</h2><p>3 दिन शेष · शीर्ष 3 विद्यार्थियों को स्कॉलर बैज मिलेगा</p></div>
          <button type="button" onClick={onClose} aria-label="Close leaderboard"><Icon name="close" /></button>
        </div>
        <div className="gz-lb-tabs" role="tablist" aria-label="लीडरबोर्ड प्रकार">
          {["कक्षा", "स्कूल", "साप्ताहिक"].map((item) => <button key={item} type="button" role="tab" aria-selected={league === item} className={league === item ? "active" : ""} onClick={() => setLeague(item)}>{item}</button>)}
        </div>
        <div className="gz-podium">
          {[leaders[1], leaders[0], leaders[2]].map((leader, index) => {
            const rank = [2, 1, 3][index];
            return (
              <motion.div key={leader.name} className={`gz-podium-item rank-${rank}`} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.12 }}>
                <span className="gz-podium-avatar">{leader.avatar}</span>
                {rank === 1 && <span className="gz-crown"><GameGlyph type="medal" size={24} /></span>}
                <strong>{leader.name}</strong>
                <small className="gz-podium-power"><GameGlyph type="flame" size={13} /> {leader.streak} दिन <b>★ {Math.min(5, Math.max(1, Math.round(leader.xp / 650)))}</b></small>
                <div><b>#{rank}</b><small>{leader.xp.toLocaleString()} XP</small></div>
              </motion.div>
            );
          })}
        </div>
        <div className="gz-rank-list">
          {leaders.slice(3).map((leader, index) => (
            <div key={`${leader.name}-${index}`} className={leader.current ? "current" : ""}>
              <b>{index + 4}</b><span className="gz-rank-avatar">{leader.avatar}</span>
              <span><strong>{leader.name}{leader.current && " (आप)"}</strong><small className="gz-rank-fire"><GameGlyph type="flame" size={13} /> {leader.streak} दिन की स्ट्रीक</small></span>
              <span className="gz-rank-score"><strong>{leader.xp.toLocaleString()} XP</strong><small>★ {Math.min(5, Math.max(1, Math.round(leader.xp / 650)))}</small></span>
            </div>
          ))}
        </div>
        <div className="gz-you-rank"><Icon name="arrowRight" size={17} /><span>अगली रैंक तक</span><strong>{Math.max(40, 1950 - totalXp)} XP</strong></div>
      </motion.section>
    </motion.div>
  );
}

function TrophyRoom({ progress, onClose }) {
  const badges = [
    { name: "पहला कदम", note: "पहला मिशन पूरा करें", icon: "play", unlocked: Object.values(progress).some((item) => item?.completed) },
    { name: "विज्ञान वीर", note: "3 अध्याय पूरे करें", icon: "shield", unlocked: scienceWorld.chapters.every((chapter) => progress[chapter.id]?.completed) },
    { name: "सटीक निशाना", note: "100% सटीकता पाएँ", icon: "check", unlocked: scienceWorld.chapters.some((chapter) => progress[chapter.id]?.best === 100) },
    { name: "स्ट्रीक स्टार", note: "7 दिन लगातार खेलें", icon: "refresh", unlocked: (progress.streak || 0) >= 7 },
    { name: "XP मास्टर", note: "1000 XP कमाएँ", icon: "sparkle", unlocked: (progress.totalXp || 0) >= 1000 },
    { name: "बॉस विजेता", note: "जल्द आ रहा है", icon: "lock", unlocked: false },
  ];
  return (
    <motion.div className="gz-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.section className="gz-trophy-room" initial={{ opacity: 0, y: 28, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18 }} onClick={(event) => event.stopPropagation()}>
        <header><div><span>आपका संग्रह</span><h2>ट्रॉफी रूम</h2><p>{badges.filter((badge) => badge.unlocked).length}/{badges.length} उपलब्धियाँ अनलॉक</p></div><button type="button" onClick={onClose} aria-label="ट्रॉफी रूम बंद करें"><Icon name="close" /></button></header>
        <div className="gz-trophy-grid">
          {badges.map((badge, index) => (
            <motion.article key={badge.name} className={badge.unlocked ? "unlocked" : "locked"} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }}>
              <span><GameGlyph type={badge.icon === "refresh" ? "flame" : badge.icon === "shield" ? "medal" : badge.icon === "play" ? "arena" : badge.icon === "lock" ? "boss" : "gem"} size={29} /></span><strong>{badge.name}</strong><small>{badge.note}</small>
            </motion.article>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}

export default function GameZone() {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [player, setPlayer] = useState("Scholar");
  const [progress, setProgress] = useState(readProgress);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [earnedXp, setEarnedXp] = useState(0);
  const [showFact, setShowFact] = useState(false);
  const [result, setResult] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [selectedClass, setSelectedClass] = useState("10");
  const [selectedSubject, setSelectedSubject] = useState("science");
  const [chapterChoice, setChapterChoice] = useState(scienceWorld.chapters[0].id);
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem("vidyaai_game_sound") !== "off");
  const [xpPop, setXpPop] = useState(null);
  const [showArenaEntry, setShowArenaEntry] = useState(Boolean(location.state?.arenaEntry));
  const audioContextRef = useRef(null);

  useEffect(() => {
    api.get("/auth/me").then((response) => {
      if (response?.data?.name) setPlayer(response.data.name);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("vidyaai_game_progress", JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    if (!showArenaEntry) return undefined;
    const timer = window.setTimeout(() => setShowArenaEntry(false), reduceMotion ? 120 : 900);
    return () => window.clearTimeout(timer);
  }, [showArenaEntry, reduceMotion]);

  const totalXp = progress.totalXp || 0;
  const completedCount = scienceWorld.chapters.filter((chapter) => progress[chapter.id]?.completed).length;
  const currentQuestion = selectedChapter?.questions[questionIndex];

  const playSound = (type) => {
    if (!soundOn || typeof window === "undefined") return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = audioContextRef.current || new AudioContext();
      audioContextRef.current = context;
      if (context.state === "suspended") context.resume();
      const notes = {
        start: [[392, 0], [523, 0.09], [659, 0.18]],
        correct: [[523, 0], [659, 0.08], [784, 0.16]],
        wrong: [[220, 0], [174, 0.11]],
        next: [[440, 0]],
        finish: [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.32]],
      }[type] || [];
      notes.forEach(([frequency, delay], index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = type === "wrong" ? "sawtooth" : "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, context.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(type === "wrong" ? 0.055 : 0.08, context.currentTime + delay + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + 0.16 + index * 0.015);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(context.currentTime + delay);
        oscillator.stop(context.currentTime + delay + 0.19 + index * 0.015);
      });
    } catch {}
  };

  const toggleSound = () => {
    setSoundOn((current) => {
      const next = !current;
      localStorage.setItem("vidyaai_game_sound", next ? "on" : "off");
      return next;
    });
  };

  const startChapter = (chapter) => {
    setSelectedChapter(prepareChapterForPlay(chapter));
    setQuestionIndex(0);
    setSelected(null);
    setScore(0);
    setCombo(0);
    setHearts(3);
    setEarnedXp(0);
    setShowFact(false);
    setResult(null);
    setXpPop(null);
    playSound("start");
  };

  const chooseAnswer = (optionIndex) => {
    if (selected !== null) return;
    const correct = optionIndex === currentQuestion.answer;
    const nextCombo = correct ? combo + 1 : 0;
    const questionXp = correct ? 20 + Math.min(nextCombo * 5, 25) : 0;
    setSelected(optionIndex);
    setShowFact(true);
    setCombo(nextCombo);
    setEarnedXp((value) => value + questionXp);
    if (correct) setScore((value) => value + 1);
    else setHearts((value) => Math.max(0, value - 1));
    setXpPop(correct ? `+${questionXp} XP` : "फिर प्रयास करें");
    playSound(correct ? "correct" : "wrong");
  };

  const advance = () => {
    if (questionIndex < selectedChapter.questions.length - 1) {
      setQuestionIndex((value) => value + 1);
      setSelected(null);
      setShowFact(false);
      setXpPop(null);
      playSound("next");
      return;
    }
    const finalScore = score + (selected === currentQuestion.answer ? 0 : 0);
    const accuracy = Math.round((finalScore / selectedChapter.questions.length) * 100);
    const bonus = accuracy === 100 ? 50 : accuracy >= 80 ? 25 : 0;
    const finalXp = earnedXp + bonus;
    const previousBest = progress[selectedChapter.id]?.best || 0;
    const nextProgress = {
      ...progress,
      totalXp: totalXp + finalXp,
      streak: (progress.streak || 0) + 1,
      [selectedChapter.id]: {
        completed: true,
        best: Math.max(previousBest, accuracy),
        stars: accuracy >= 80 ? 3 : accuracy >= 60 ? 2 : 1,
      },
    };
    setProgress(nextProgress);
    setResult({ accuracy, xp: finalXp, score: finalScore, bonus });
    playSound("finish");
  };

  const exitGame = () => {
    setSelectedChapter(null);
    setResult(null);
  };

  return (
    <div className="gz-shell">
      <div className="gz-orb gz-orb-one" /><div className="gz-orb gz-orb-two" />
      <AnimatePresence>
        {showArenaEntry && (
          <motion.div className="gz-arena-entry" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? .05 : .28 }}>
            <motion.div className="gz-entry-gate gate-left" initial={{ x: 0 }} animate={{ x: reduceMotion ? "-100%" : "-104%" }} transition={{ delay: reduceMotion ? 0 : .34, duration: reduceMotion ? .05 : .46, ease: [0.76, 0, 0.24, 1] }} />
            <motion.div className="gz-entry-gate gate-right" initial={{ x: 0 }} animate={{ x: reduceMotion ? "100%" : "104%" }} transition={{ delay: reduceMotion ? 0 : .34, duration: reduceMotion ? .05 : .46, ease: [0.76, 0, 0.24, 1] }} />
            <motion.div className="gz-entry-core" initial={reduceMotion ? false : { opacity: 0, scale: .72 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
              <span><Icon name="sparkle" size={34} /></span>
              <small>VIDYAAI</small>
              <strong>ज्ञान अखाड़ा</strong>
              <em>खेल शुरू हो रहा है…</em>
            </motion.div>
            <button type="button" onClick={() => setShowArenaEntry(false)}>छोड़ें</button>
          </motion.div>
        )}
      </AnimatePresence>
      <GameHeader player={player} totalXp={totalXp} onLeaderboard={() => setShowLeaderboard(true)} onAchievements={() => setShowAchievements(true)} soundOn={soundOn} onSoundToggle={toggleSound} />

      <main className="gz-main">
        <AnimatePresence mode="wait">
          {!selectedChapter ? (
            <motion.div key="lobby" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
              <section className="gz-arena-lobby">
                <div className="gz-arena-layout">
                  <aside className="gz-arena-rail gz-arena-left">
                    <div className="gz-rail-profile">
                      <span>{player.charAt(0).toUpperCase()}</span>
                      <div><small>आज का खिलाड़ी</small><strong>{player}</strong></div>
                    </div>
                    <div className="gz-rail-metrics">
                      <div><GameGlyph type="gem" size={19} /><span><small>कुल XP</small><strong>{totalXp}</strong></span></div>
                      <div><GameGlyph type="flame" size={19} /><span><small>स्ट्रीक</small><strong>{progress.streak || 0} दिन</strong></span></div>
                      <div><GameGlyph type="medal" size={19} /><span><small>मिशन पूरे</small><strong>{completedCount}/3</strong></span></div>
                    </div>
                    <div className="gz-rail-section">
                      <span className="gz-rail-label">विषय</span>
                      {subjects.map((subject) => (
                        <button key={subject.id} type="button" className={subject.available ? "active" : ""} disabled={!subject.available}>
                          <Icon name={subject.id === "science" ? "sparkle" : subject.id === "math" ? "code" : "library"} size={17} />
                          <span>{subject.label}</span>
                          <small>{subject.available ? "3" : "जल्द"}</small>
                        </button>
                      ))}
                    </div>
                    <button type="button" className="gz-rail-exit" onClick={() => navigate("/dashboard")}>
                      <Icon name="arrowLeft" size={17} />
                      <span>अखाड़े से बाहर जाएँ</span>
                    </button>
                  </aside>

                  <div className="gz-arena-center">
                <div className="gz-arena-banner">
                  <div className="gz-knowledge-world" aria-hidden="true">
                    <i /><i /><i /><span /><span /><b />
                  </div>
                  <button type="button" className="gz-arena-back" onClick={() => navigate("/dashboard")} aria-label="डैशबोर्ड पर वापस जाएँ"><Icon name="arrowLeft" size={20} /></button>
                  <motion.div className="gz-arena-emblem" initial={reduceMotion ? false : { scale: .7, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 220, damping: 13, delay: .15 }}><GameGlyph type="arena" size={38} /></motion.div>
                  <div className="gz-arena-copy"><span>कक्षा 10 · विज्ञान</span><h1>ज्ञान अखाड़ा</h1><p>अध्याय चुनिए। चुनौती जीतिए। XP कमाइए।</p></div>
                  <div className="gz-mission-flight" aria-hidden="true">
                    <small>मिशन लाइव</small>
                    <div className="gz-flight-track">
                      <i /><i /><i />
                      <motion.span
                        animate={reduceMotion ? { x: 88 } : { x: [0, 42, 88, 132], y: [0, -7, 4, 0] }}
                        transition={{ duration: 3.2, repeat: 1, repeatDelay: .55, ease: "easeInOut" }}
                      >
                        <Icon name="play" size={13} />
                      </motion.span>
                    </div>
                  </div>
                  <div className="gz-arena-stats">
                    <div><GameGlyph type="flame" size={20} /><span><small>स्ट्रीक</small><strong>{progress.streak || 0} दिन</strong></span></div>
                    <div><GameGlyph type="medal" size={20} /><span><small>महारत</small><strong>{completedCount}/3</strong></span></div>
                  </div>
                  <button type="button" className="gz-next-reward" onClick={() => setShowAchievements(true)}>
                    <GameGlyph type="medal" size={20} /><span><small>अगला इनाम</small><strong>विज्ञान वीर बैज</strong></span><b>{completedCount}/3</b>
                  </button>
                </div>

                <div className="gz-arena-filters">
                  <label>
                    <span className="gz-filter-icon"><GameGlyph type="medal" size={24} /></span>
                    <span className="gz-filter-copy"><small>अपना स्तर चुनें</small><strong>कक्षा</strong></span>
                    <select aria-label="कक्षा चुनें" value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}><option value="10">10वीं कक्षा</option><option value="9" disabled>9वीं · जल्द</option></select>
                    <b>READY</b>
                  </label>
                  <label>
                    <span className="gz-filter-icon subject"><GameGlyph type="reaction" size={25} /></span>
                    <span className="gz-filter-copy"><small>अपना गेम वर्ल्ड</small><strong>विषय</strong></span>
                    <select aria-label="विषय चुनें" value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)}>{subjects.map((subject) => <option key={subject.id} value={subject.id} disabled={!subject.available}>{subject.label}{!subject.available ? " · जल्द" : ""}</option>)}</select>
                    <b>3 मिशन</b>
                  </label>
                </div>

                <div className="gz-arena-heading"><div><span>आपकी अध्याय यात्रा</span><h2>अगला पड़ाव चुनें</h2></div><button type="button" onClick={() => setShowAchievements(true)}><Icon name="shield" size={15} /> ट्रॉफी देखें</button></div>
                <div className="gz-arena-missions">
                  {scienceWorld.chapters.map((chapter, index) => {
                    const chapterProgress = progress[chapter.id];
                    return (
                      <motion.article
                        key={chapter.id}
                        className={`gz-mission-card ${chapterChoice === chapter.id ? "selected current" : ""} ${chapterProgress?.completed ? "completed" : ""}`}
                        style={{ "--chapter": chapter.accent, "--chapter-glow": chapter.glow }}
                        onClick={() => setChapterChoice(chapter.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setChapterChoice(chapter.id);
                          }
                        }}
                        role="button"
                        tabIndex="0"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: reduceMotion ? 0 : index * 0.07 }}
                        whileTap={reduceMotion ? {} : { scale: .98 }}
                      >
                        <span className="gz-mission-icon"><GameGlyph type={chapter.id === "chemical-reactions" ? "reaction" : chapter.id === "acids-bases" ? "potion" : "life"} size={31} /></span>
                        <span className="gz-mission-copy"><small>{chapterProgress?.completed ? "मिशन पूरा" : chapterChoice === chapter.id ? "वर्तमान मिशन" : `मिशन ${chapter.number}`}</small><strong>{chapter.hindiTitle}</strong><em>{chapter.duration} · 5 प्रश्न · {chapter.xp} XP</em><span className="gz-mission-stars" aria-label={`${chapterProgress?.stars || 0} सितारे`}>{[1,2,3].map((star) => <i key={star} className={star <= (chapterProgress?.stars || 0) ? "earned" : ""}>★</i>)}</span></span>
                        <button
                          type="button"
                          className="gz-mission-play"
                          onClick={(event) => {
                            event.stopPropagation();
                            startChapter(chapter);
                          }}
                          aria-label={`${chapter.hindiTitle} खेलें`}
                        >
                          <Icon name="play" size={15} />
                          <span>{chapterProgress?.completed ? "फिर खेलें" : "खेलें"}</span>
                        </button>
                      </motion.article>
                    );
                  })}
                  <article className={`gz-boss-arena ${completedCount === 3 ? "unlocked" : "locked"}`} aria-label={completedCount === 3 ? "विज्ञान बॉस बैटल तैयार है" : "बॉस बैटल सभी अध्यायों के बाद खुलेगा"}>
                    <div className="gz-boss-world" aria-hidden="true"><i /><i /><i /><span /><span /></div>
                    <motion.span className="gz-boss-avatar" initial={reduceMotion ? false : { scale: .75, rotate: -8 }} whileInView={{ scale: 1, rotate: 0 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 220, damping: 14 }}>
                      <GameGlyph type="boss" size={42} />
                    </motion.span>
                    <div className="gz-boss-copy">
                      <small>अंतिम पड़ाव · महायुद्ध</small><strong>विज्ञान बॉस बैटल</strong><em>तीनों अध्यायों की शक्तियों से बॉस को हराएँ</em>
                      <div className="gz-boss-health"><span><b>बॉस शक्ति</b><small>300 HP</small></span><i><b /></i></div>
                    </div>
                    <button type="button" disabled={completedCount !== 3}>
                      <Icon name={completedCount === 3 ? "play" : "lock"} size={17} />
                      <span>{completedCount === 3 ? "युद्ध शुरू करें" : `${completedCount}/3 अनलॉक`}</span>
                    </button>
                  </article>
                </div>
                <motion.button
                  type="button"
                  className="gz-arena-play"
                  whileTap={reduceMotion ? {} : { scale: .97 }}
                  onClick={() => startChapter(scienceWorld.chapters.find((chapter) => chapter.id === chapterChoice) || scienceWorld.chapters[0])}
                >
                  <span><Icon name="play" size={22} /></span>
                  <strong>मिशन शुरू करें</strong>
                  <small>{scienceWorld.chapters.find((chapter) => chapter.id === chapterChoice)?.hindiTitle}</small>
                </motion.button>
                  </div>

                  <aside className="gz-arena-rail gz-arena-right">
                    <div className="gz-rail-head">
                      <div><small>साप्ताहिक लीग</small><strong>शीर्ष खिलाड़ी</strong></div>
                      <button type="button" onClick={() => setShowLeaderboard(true)} aria-label="पूरा लीडरबोर्ड देखें"><Icon name="arrowRight" size={17} /></button>
                    </div>
                    <div className="gz-mini-leaders">
                      {seededLeaders.slice(0, 4).map((leader, index) => (
                        <div key={leader.name}>
                          <b>{index + 1}</b>
                          <span>{leader.avatar}</span>
                          <div><strong>{leader.name}</strong><small>{leader.xp.toLocaleString()} XP</small></div>
                        </div>
                      ))}
                    </div>
                    <div className="gz-rail-section gz-chapter-progress">
                      <span className="gz-rail-label">अध्याय प्रगति</span>
                      {scienceWorld.chapters.map((chapter) => {
                        const item = progress[chapter.id];
                        return (
                          <button key={chapter.id} type="button" onClick={() => setChapterChoice(chapter.id)}>
                            <span>{chapter.number}</span>
                            <div><strong>{chapter.hindiTitle}</strong><i><b style={{ width: `${item?.best || 0}%` }} /></i></div>
                            <small>{item?.best || 0}%</small>
                          </button>
                        );
                      })}
                    </div>
                  </aside>
                </div>
              </section>
            </motion.div>
          ) : result ? (
            <motion.section key="result" className="gz-result" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}>
              {burst.map((item) => <motion.i key={item.id} style={{ background: item.color }} initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: item.x, y: item.y, opacity: 0, rotate: 180 }} transition={{ duration: 1.1, delay: 0.15 }} />)}
              <motion.div className="gz-result-badge" initial={{ rotate: -15, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", delay: 0.1 }}><GameGlyph type="medal" size={48} /></motion.div>
              <span>अभियान पूरा हुआ</span><h1>{result.accuracy >= 80 ? "शानदार प्रदर्शन!" : "बहुत अच्छी प्रगति!"}</h1>
              <p>आपने <strong>{selectedChapter.hindiTitle}</strong> की आवश्यक अवधारणाओं का अभ्यास पूरा किया।</p>
              <div className="gz-result-score">
                <div><small>सटीकता</small><strong>{result.accuracy}%</strong></div>
                <div><small>प्राप्त XP</small><strong>+{result.xp}</strong></div>
                <div><small>सही उत्तर</small><strong>{result.score}/{selectedChapter.questions.length}</strong></div>
              </div>
              {result.bonus > 0 && <div className="gz-bonus">✦ महारत बोनस +{result.bonus} XP</div>}
              <div className="gz-result-actions">
                <button type="button" onClick={() => startChapter(selectedChapter)}><Icon name="refresh" size={18} /> फिर खेलें</button>
                <button type="button" className="primary" onClick={exitGame}>अगला अध्याय चुनें <Icon name="arrowRight" size={18} /></button>
              </div>
            </motion.section>
          ) : (
            <motion.section key={`question-${questionIndex}`} className="gz-game gz-theme-science" style={{ "--game-accent": selectedChapter.accent }} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}>
              <div className="gz-game-top">
                <button type="button" onClick={exitGame} aria-label="Exit quest"><Icon name="close" /></button>
                <div className="gz-hud-progress"><span><b>{selectedChapter.hindiTitle}</b><small>प्रश्न {questionIndex + 1}/{selectedChapter.questions.length}</small></span><div className="gz-progress-track"><motion.span initial={{ width: 0 }} animate={{ width: `${((questionIndex + 1) / selectedChapter.questions.length) * 100}%` }} /></div></div>
                <span className="gz-hearts" aria-label={`${hearts} hearts`}>{[0, 1, 2].map((heart) => <b key={heart} className={heart < hearts ? "" : "lost"}>♥</b>)}</span>
              </div>
              <motion.div className="gz-question-card" layout>
                <AnimatePresence>
                  {xpPop && (
                    <motion.div className={`gz-xp-pop ${selected === currentQuestion.answer ? "win" : "miss"}`} initial={{ opacity: 0, scale: .4, y: 16 }} animate={{ opacity: 1, scale: 1, y: -18 }} exit={{ opacity: 0, y: -45 }}>
                      {xpPop}
                      {selected === currentQuestion.answer && answerSparkles.map((spark) => (
                        <motion.i key={spark.id} initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: spark.x, y: spark.y, opacity: 0 }} transition={{ duration: .7 }} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.div
                  className="gz-question-reveal"
                  initial={reduceMotion ? false : { opacity: 0, y: 24, scale: .97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: reduceMotion ? 0 : .42, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="gz-question-kicker">सही विकल्प चुनिए</span>
                  <h2>{currentQuestion.prompt}</h2>
                </motion.div>
                <motion.div
                  className="gz-options"
                  initial="hidden"
                  animate="visible"
                  variants={{ hidden: {}, visible: { transition: { delayChildren: reduceMotion ? 0 : .48, staggerChildren: reduceMotion ? 0 : .11 } } }}
                >
                  {currentQuestion.options.map((option, index) => {
                    const isCorrect = selected !== null && index === currentQuestion.answer;
                    const isWrong = selected === index && index !== currentQuestion.answer;
                    return (
                      <motion.button
                        type="button"
                        key={option}
                        aria-pressed={selected === index}
                        className={`${selected === index ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
                        onClick={() => chooseAnswer(index)}
                        variants={{
                          hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 22, scale: .94 },
                          visible: reduceMotion
                            ? { opacity: 1 }
                            : { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 310, damping: 24 } },
                        }}
                        whileHover={selected === null ? { x: 5 } : {}}
                        whileTap={selected === null ? { scale: .98 } : {}}
                        animate={isWrong ? { x: [0, -8, 8, -5, 0] } : {}}
                      >
                        <b>{String.fromCharCode(65 + index)}</b><span>{option}</span>
                        {isCorrect && <em>✓</em>}{isWrong && <em>×</em>}
                      </motion.button>
                    );
                  })}
                </motion.div>
                <AnimatePresence>
                  {showFact && (
                    <motion.div className={`gz-fact ${selected === currentQuestion.answer ? "correct" : "wrong"}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                      <span>{selected === currentQuestion.answer ? "✦ बहुत बढ़िया! +" + (20 + Math.min(combo * 5, 25)) + " XP" : "सीखते रहिए"}</span>
                      <p>{currentQuestion.fact}</p>
                      <button type="button" onClick={advance}>{questionIndex === selectedChapter.questions.length - 1 ? "परिणाम देखें" : "अगली चुनौती"} <Icon name="arrowRight" size={18} /></button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <p className="gz-key-hint">उत्तर चुनने के लिए विकल्प दबाएँ · हर गलती आपको कुछ नया सिखाती है</p>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
      <AnimatePresence>{showLeaderboard && <Leaderboard player={player} totalXp={totalXp} onClose={() => setShowLeaderboard(false)} />}</AnimatePresence>
      <AnimatePresence>{showAchievements && <TrophyRoom progress={progress} onClose={() => setShowAchievements(false)} />}</AnimatePresence>
    </div>
  );
}
