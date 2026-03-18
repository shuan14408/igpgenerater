// pages/index.js
// IGP Generator - Full page component for Next.js deployment
import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";

/* ═══════════════════════════════════════════
   Anthropic API helpers - calls go through /api/claude proxy
   ═══════════════════════════════════════════ */
const API_URL = "/api/claude";

async function callClaude(systemPrompt, userContent, maxTokens = 4000) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, system: systemPrompt, messages: [{ role: "user", content: userContent }] }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.content.map((b) => b.text || "").join("\n");
}

async function callClaudeMultiContent(systemPrompt, contentBlocks, maxTokens = 8000) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, system: systemPrompt, messages: [{ role: "user", content: contentBlocks }] }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.content.map((b) => b.text || "").join("\n");
}

async function callClaudeWithImage(systemPrompt, textPrompt, base64, mediaType) {
  return callClaudeMultiContent(systemPrompt, [
    { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
    { type: "text", text: textPrompt },
  ]);
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = () => reject(new Error("檔案讀取失敗"));
    r.readAsDataURL(file);
  });
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("檔案讀取失敗"));
    r.readAsArrayBuffer(file);
  });
}

/* ═══════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════ */
const COG = [
  { id: 1, label: "觀察能力" }, { id: 2, label: "記憶能力" }, { id: 3, label: "理解能力" },
  { id: 4, label: "推理能力" }, { id: 5, label: "分析能力" }, { id: 6, label: "應用能力" },
  { id: 7, label: "評鑑能力" }, { id: 8, label: "創造能力" }, { id: 9, label: "批判能力" },
  { id: 10, label: "問題解決" }, { id: 11, label: "後設能力" }, { id: 12, label: "其他" },
];
const AFF = [
  { id: 13, label: "專注能力" }, { id: 14, label: "成就動機" }, { id: 15, label: "要求完美" },
  { id: 16, label: "溝通協調" }, { id: 17, label: "情緒控制" }, { id: 18, label: "挫折容忍" },
  { id: 19, label: "正向思考" }, { id: 20, label: "領導能力" }, { id: 21, label: "合作能力" },
  { id: 22, label: "自信心" }, { id: 23, label: "同理心" }, { id: 24, label: "復原力" }, { id: 25, label: "其他" },
];
const SUB = [
  { id: 26, label: "數學" }, { id: 27, label: "物理" }, { id: 28, label: "生物" },
  { id: 29, label: "化學" }, { id: 30, label: "地科" }, { id: 31, label: "國文" },
  { id: 32, label: "英文" }, { id: 33, label: "歷史" }, { id: 34, label: "地理" },
  { id: 35, label: "公民" }, { id: 36, label: "資訊" }, { id: 37, label: "生科" }, { id: 38, label: "其他" },
];
const ALL_TRAITS = [...COG, ...AFF, ...SUB];

const TABS = [
  { key: "analysis", icon: "📊", label: "優弱勢評析" },
  { key: "curriculum", icon: "📚", label: "課程與目標" },
  { key: "meeting", icon: "📝", label: "會議紀錄" },
  { key: "counseling", icon: "💬", label: "晤談輔導" },
];

/* ═══════════════════════════════════════════
   Styles
   ═══════════════════════════════════════════ */
const S = {
  app: { fontFamily: "'Noto Sans TC','Helvetica Neue',sans-serif", minHeight: "100vh", background: "linear-gradient(135deg,#f0f4ff 0%,#e8edf5 50%,#f5f0ff 100%)", color: "#1a1a2e" },
  sidebar: { width: 220, background: "linear-gradient(180deg,#1a1a2e 0%,#16213e 100%)", color: "#fff", display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0 },
  logo: { padding: "0 20px 28px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 8 },
  logoTitle: { fontSize: 22, fontWeight: 800, letterSpacing: 2, background: "linear-gradient(135deg,#a5b4fc,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  logoSub: { fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 4, letterSpacing: 1 },
  tabBtn: (a) => ({ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", border: "none", background: a ? "rgba(129,140,248,0.15)" : "transparent", color: a ? "#a5b4fc" : "rgba(255,255,255,0.55)", cursor: "pointer", fontSize: 14, fontWeight: a ? 700 : 400, borderLeft: a ? "3px solid #818cf8" : "3px solid transparent", transition: "all .2s", textAlign: "left", fontFamily: "inherit" }),
  main: { flex: 1, padding: "32px 40px", overflowY: "auto", maxHeight: "100vh" },
  card: { background: "#fff", borderRadius: 16, padding: "28px 32px", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.04)" },
  h2: { fontSize: 18, fontWeight: 700, marginBottom: 18, color: "#1a1a2e", display: "flex", alignItems: "center", gap: 10 },
  h3: { fontSize: 15, fontWeight: 600, marginBottom: 12, color: "#374151" },
  label: { fontSize: 13, fontWeight: 600, color: "#4b5563", marginBottom: 6, display: "block" },
  input: { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  textarea: { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, outline: "none", minHeight: 120, resize: "vertical", lineHeight: 1.7, boxSizing: "border-box", fontFamily: "inherit" },
  row: { display: "flex", gap: 16, marginBottom: 14 },
  col: { flex: 1 },
  chipGroup: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: (sel, color) => {
    const c = color === "red";
    return { padding: "7px 16px", borderRadius: 20, border: sel ? `2px solid ${c ? "#f87171" : "#818cf8"}` : "2px solid #e2e8f0", background: sel ? (c ? "rgba(248,113,113,0.1)" : "rgba(129,140,248,0.1)") : "#fafafa", color: sel ? (c ? "#dc2626" : "#4338ca") : "#6b7280", cursor: "pointer", fontSize: 13, fontWeight: sel ? 600 : 400, transition: "all .2s", userSelect: "none", fontFamily: "inherit" };
  },
  btn: (v) => ({ padding: "12px 28px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, transition: "all .2s", fontFamily: "inherit", ...(v === "primary" ? { background: "linear-gradient(135deg,#818cf8,#6366f1)", color: "#fff", boxShadow: "0 2px 8px rgba(99,102,241,0.25)" } : v === "success" ? { background: "linear-gradient(135deg,#34d399,#10b981)", color: "#fff" } : { background: "#f1f5f9", color: "#475569", border: "1.5px solid #e2e8f0" }) }),
  upload: { border: "2px dashed #c7d2fe", borderRadius: 14, padding: "32px 24px", textAlign: "center", background: "rgba(129,140,248,0.03)", cursor: "pointer", transition: "all .2s" },
  badge: (c) => ({ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: c === "blue" ? "#eff6ff" : c === "green" ? "#ecfdf5" : c === "purple" ? "#f5f3ff" : c === "orange" ? "#fff7ed" : "#fef3c7", color: c === "blue" ? "#2563eb" : c === "green" ? "#059669" : c === "purple" ? "#7c3aed" : c === "orange" ? "#ea580c" : "#d97706" }),
  spinner: { display: "inline-block", width: 18, height: 18, border: "2.5px solid rgba(129,140,248,0.3)", borderTopColor: "#818cf8", borderRadius: "50%", animation: "spin .7s linear infinite" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { padding: "10px 12px", background: "#f1f5f9", borderBottom: "2px solid #e2e8f0", textAlign: "left", fontWeight: 700, color: "#374151" },
  td: { padding: "10px 12px", borderBottom: "1px solid #f1f5f9", color: "#4b5563" },
  toast: { position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "#fef2f2", border: "1.5px solid #fca5a5", borderRadius: 14, padding: "14px 28px", color: "#991b1b", fontWeight: 600, fontSize: 14, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", gap: 10, maxWidth: 520 },
};

/* ═══════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════ */
function Spinner() {
  return <span style={S.spinner} />;
}

function Toast({ msg, onClose }) {
  if (!msg) return null;
  return <div style={S.toast}><span style={{ fontSize: 20 }}>⚠️</span><span>{msg}</span><span onClick={onClose} style={{ cursor: "pointer", marginLeft: 12, opacity: 0.5, fontSize: 18 }}>✕</span></div>;
}

function UploadArea({ accept, onFile, label, multiple }) {
  const ref = useRef();
  return (
    <div style={S.upload} onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#818cf8"; }}
      onDragLeave={e => { e.currentTarget.style.borderColor = "#c7d2fe"; }}
      onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#c7d2fe"; const f = Array.from(e.dataTransfer.files); multiple ? onFile(f) : f[0] && onFile(f[0]); }}>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }} multiple={multiple} onChange={e => { const f = Array.from(e.target.files); multiple ? onFile(f) : f[0] && onFile(f[0]); e.target.value = ""; }} />
      <div style={{ fontSize: 36, marginBottom: 8 }}>📁</div>
      <div style={{ fontWeight: 600, color: "#4338ca", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: "#94a3b8" }}>{accept}</div>
    </div>
  );
}

function CourseBlock({ course, idx, onUpdate }) {
  return (
    <div style={{ ...S.card, border: "1.5px solid #e0e7ff" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={S.badge("purple")}>課程 {idx + 1}</span>
        <span style={S.badge("blue")}>{course.domain || "未分類"}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{course.name}</span>
      </div>
      <div style={S.row}>
        <div style={S.col}><label style={S.label}>學習領域</label><input style={S.input} value={course.domain || ""} onChange={e => onUpdate({ ...course, domain: e.target.value })} /></div>
        <div style={S.col}><label style={S.label}>課程名稱</label><input style={S.input} value={course.name || ""} onChange={e => onUpdate({ ...course, name: e.target.value })} /></div>
        <div style={S.col}><label style={S.label}>授課教師</label><input style={S.input} value={course.teacher || ""} onChange={e => onUpdate({ ...course, teacher: e.target.value })} /></div>
      </div>
      <label style={S.label}>學年/學期目標 <span style={{ color: "#94a3b8", fontWeight: 400 }}>（與原課程計畫一致）</span></label>
      <textarea style={{ ...S.textarea, minHeight: 100, background: "#f8fafc" }} value={course.objectives || ""} onChange={e => onUpdate({ ...course, objectives: e.target.value })} />
      <div style={{ marginTop: 14 }}>
        <label style={S.label}>教育需求與輔導建議事項 <span style={S.badge("orange")}>已個別化調整</span></label>
        <textarea style={{ ...S.textarea, minHeight: 80 }} value={course.eduNeeds || ""} onChange={e => onUpdate({ ...course, eduNeeds: e.target.value })} />
      </div>
      <div style={{ marginTop: 14 }}>
        <label style={S.label}>學習表現調整 <span style={S.badge("orange")}>依108課綱學習表現個別化差異化</span></label>
        {(course.performances || []).map((p, pi) => (
          <div key={pi} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
            <span style={{ fontWeight: 700, color: "#818cf8", minWidth: 28, paddingTop: 10 }}>{pi + 1}.</span>
            <textarea style={{ ...S.textarea, minHeight: 56, flex: 1 }} value={p} onChange={e => { const np = [...(course.performances || [])]; np[pi] = e.target.value; onUpdate({ ...course, performances: np }); }} />
          </div>
        ))}
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>評量方式：⑤實作評量 ⑬口語評量 ⑮學習單 ⑯檔案評量</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main App
   ═══════════════════════════════════════════ */
export default function IGPGenerator() {
  const [tab, setTab] = useState("analysis");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [strengths, setStrengths] = useState([]);
  const [weaknesses, setWeaknesses] = useState([]);
  const [meetingNotes, setMeetingNotes] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [analysisWriter, setAnalysisWriter] = useState("");
  const [analysisDate, setAnalysisDate] = useState("");
  const [currFile, setCurrFile] = useState(null);
  const [studentFile, setStudentFile] = useState(null);
  const [studentText, setStudentText] = useState("");
  const [courses, setCourses] = useState([]);
  const [meetingImages, setMeetingImages] = useState([]);
  const [meetingOcrResult, setMeetingOcrResult] = useState("");
  const [counselingImages, setCounselingImages] = useState([]);
  const [counselingResult, setCounselingResult] = useState([]);

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 4000); };

  const toggleStrength = (id) => {
    if (weaknesses.includes(id)) { showToast(`「○${id} ${ALL_TRAITS.find(x=>x.id===id)?.label}」已被選為弱勢能力，不可同時列為優勢與弱勢！`); return; }
    setStrengths(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleWeakness = (id) => {
    if (strengths.includes(id)) { showToast(`「○${id} ${ALL_TRAITS.find(x=>x.id===id)?.label}」已被選為優勢能力，不可同時列為優勢與弱勢！`); return; }
    setWeaknesses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const generateAnalysis = async () => {
    if (strengths.length < 1 && weaknesses.length < 1) { showToast("請先選擇至少一項優勢與弱勢能力"); return; }
    setLoading(true); setLoadingMsg("AI 正在撰寫優弱勢質性描述...");
    try {
      const sL = strengths.map(id => `○${id} ${ALL_TRAITS.find(t => t.id === id)?.label}`).join("、");
      const wL = weaknesses.map(id => `○${id} ${ALL_TRAITS.find(t => t.id === id)?.label}`).join("、");
      const prompt = `你是台灣國小資優班的特教教師，正在撰寫資優學生的個別輔導計畫（IGP）中「三、優弱勢能力綜合評析」的質性描述。\n\n優勢能力：${sL}\n弱勢能力：${wL}\n\n以下是會議紀錄/教師觀察中關於學生的描述：\n${meetingNotes || "(無額外紀錄)"}\n\n請撰寫4~5點「優弱勢能力綜合評析」質性描述：\n1. 每點以阿拉伯數字編號\n2. 前2~3點描述優勢能力，搭配具體事例\n3. 接下來1~2點描述弱勢能力需加強之處\n4. 最後1點為整體輔導建議方向\n5. 語氣客觀專業、正向表述、避免標籤化\n6. 直接回覆質性描述，不加標題`;
      const r = await callClaude("你是專業的台灣特教教師，擅長撰寫資優學生IGP文件。請只輸出質性描述。", prompt);
      setAnalysisResult(r);
    } catch (e) { showToast("生成失敗：" + e.message); }
    setLoading(false);
  };

  const fileToBlock = async (file) => {
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    const isDocx = file.name?.endsWith(".docx") || file.type.includes("word") || file.type.includes("openxmlformats");
    if (isImage) {
      const base64 = await readFileAsBase64(file);
      return { type: "image", source: { type: "base64", media_type: file.type, data: base64 } };
    }
    if (isPdf) {
      const base64 = await readFileAsBase64(file);
      return { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } };
    }
    if (isDocx) {
      const mammoth = (await import("mammoth")).default || await import("mammoth");
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const result = await mammoth.extractRawText({ arrayBuffer });
      return { type: "text", text: `[以下是從 Word 文件「${file.name}」中提取的完整內容]\n\n${result.value}` };
    }
    return { type: "text", text: `[檔案: ${file.name}] 無法解析此格式，請使用 PDF 或圖片。` };
  };

  const generateCourses = async () => {
    if (!currFile) { showToast("請先上傳學年度課程計畫"); return; }
    if (!studentFile && !studentText.trim() && !meetingNotes.trim() && !analysisResult.trim()) { showToast("請上傳學生 IGP 會議紀錄或輸入學生概況"); return; }
    setLoading(true); setLoadingMsg("AI 正在解析課程計畫與學生資料...");
    try {
      const blocks = [];
      blocks.push(await fileToBlock(currFile));
      if (studentFile) blocks.push(await fileToBlock(studentFile));
      const sL = strengths.map(id => `○${id} ${ALL_TRAITS.find(t => t.id === id)?.label}`).join("、");
      const wL = weaknesses.map(id => `○${id} ${ALL_TRAITS.find(t => t.id === id)?.label}`).join("、");
      blocks.push({ type: "text", text: `你是台灣國小資優班特教教師，正在根據以下資料撰寫IGP「四、課程需求評估」與「五、教育目標與輔導重點」。\n\n═══ 資料說明 ═══\n• 第一個檔案 = 學年度課程計畫\n${studentFile ? "• 第二個檔案 = 學生 IGP 會議紀錄" : ""}\n${studentText.trim() ? `• 學生概況：\n${studentText}` : ""}\n${meetingNotes.trim() ? `• 會議紀錄：\n${meetingNotes}` : ""}\n${analysisResult.trim() ? `• 優弱勢評析：\n${analysisResult}` : ""}\n${sL ? `• 優勢能力：${sL}` : ""}\n${wL ? `• 弱勢能力：${wL}` : ""}\n\n═══ 生成規則 ═══\n\n【1. 學年/學期目標】★必須與原課程計畫完全一致★\n\n【2. 教育需求與輔導建議事項】以✓標註勾選項目：\n• 認知教學（內容/歷程/結果/環境調整）\n• 情意輔導（輔導重點/方式）\n• 技能培訓（培訓重點/方式）\n\n【3. 學習表現調整】★最關鍵★\n• 從原課程計畫「領綱學習重點」→「學習表現」擷取4~5項\n• ★務必保留108課綱編碼★\n• 依學生弱勢做個別化差異化修改\n\n請以JSON格式回覆（不加markdown）：\n[{"domain":"","name":"","teacher":"","objectives":"","eduNeeds":"","performances":[""]}]` });
      const result = await callClaudeMultiContent("你是專業台灣特教教師，精通108課綱與資優學生IGP。只輸出JSON。", blocks, 8000);
      let cleaned = result.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setCourses(Array.isArray(parsed) ? parsed : parsed.courses || []);
    } catch (e) { console.error(e); showToast("生成失敗：" + e.message); }
    setLoading(false);
  };

  const handleMeetingOcr = async (files) => {
    const arr = Array.isArray(files) ? files : [files];
    setMeetingImages(prev => [...prev, ...arr.map(f => f.name)]);
    setLoading(true); setLoadingMsg("AI 正在辨識手寫文字...");
    try {
      let allText = "";
      for (const file of arr) {
        const base64 = await readFileAsBase64(file);
        const r = await callClaudeWithImage("你是專業的文字辨識系統。", `辨識圖片中所有手寫文字，保留段落結構。無法辨識的字用□表示。然後整理成會議紀錄格式。`, base64, file.type || "image/jpeg");
        allText += (allText ? "\n\n---\n\n" : "") + r;
      }
      setMeetingOcrResult(prev => (prev ? prev + "\n\n---\n\n" : "") + allText);
    } catch (e) { showToast("辨識失敗：" + e.message); }
    setLoading(false);
  };

  const handleCounselingUpload = async (files) => {
    const arr = Array.isArray(files) ? files : [files];
    setCounselingImages(prev => [...prev, ...arr.map(f => f.name)]);
    setLoading(true); setLoadingMsg("AI 正在解析晤談輔導紀錄...");
    try {
      let allRec = [];
      for (const file of arr) {
        const block = await fileToBlock(file);
        const r = await callClaudeMultiContent("你是台灣特教教師。", [block, { type: "text", text: `解析晤談紀錄，JSON陣列回覆：[{"date":"","participants":"","event":"","content":"","action":""}]` }]);
        let cleaned = r.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        try { allRec = [...allRec, ...JSON.parse(cleaned)]; } catch { allRec.push({ date: "待確認", participants: "", event: "", content: cleaned, action: "待確認" }); }
      }
      setCounselingResult(prev => [...prev, ...allRec]);
    } catch (e) { showToast("解析失敗：" + e.message); }
    setLoading(false);
  };

  const renderChips = (traits, isStr) => traits.map(t => (
    <span key={t.id} style={S.chip(isStr ? strengths.includes(t.id) : weaknesses.includes(t.id), isStr ? "blue" : "red")}
      onClick={() => isStr ? toggleStrength(t.id) : toggleWeakness(t.id)}>○{t.id} {t.label}</span>
  ));

  return (
    <>
      <Head>
        <title>IGP 生成器 - 資優學生個別輔導計畫</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}} * {margin:0;padding:0;box-sizing:border-box;} body{overflow:hidden;}`}</style>
      </Head>
      <div style={{ ...S.app, display: "flex", height: "100vh" }}>
        <Toast msg={toastMsg} onClose={() => setToastMsg("")} />
        {loading && (
          <div style={{ position: "fixed", inset: 0, zIndex: 998, background: "rgba(26,26,46,0.6)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: "36px 48px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
              <div style={{ marginBottom: 16 }}><Spinner /></div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{loadingMsg}</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>處理中，請稍候...</div>
            </div>
          </div>
        )}
        <nav style={S.sidebar}>
          <div style={S.logo}><div style={S.logoTitle}>IGP 生成器</div><div style={S.logoSub}>資優學生個別輔導計畫</div></div>
          {TABS.map(t => (<button key={t.key} style={S.tabBtn(tab === t.key)} onClick={() => setTab(t.key)}><span style={{ fontSize: 18 }}>{t.icon}</span> {t.label}</button>))}
          <div style={{ flex: 1 }} />
          <div style={{ padding: "0 20px" }}><div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.8 }}><div style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, marginBottom: 6 }}>📋 使用流程</div>1. 優弱勢評析<br/>2. 課程與目標<br/>3. 會議紀錄 OCR<br/>4. 晤談輔導</div></div>
          <div style={{ padding: "16px 20px", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Powered by Claude AI</div>
        </nav>
        <main style={S.main}>
          {tab === "analysis" && (<>
            <div style={S.card}>
              <h2 style={S.h2}>📊 三、優弱勢能力評析</h2>
              <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>選取優勢與弱勢各 3~5 項。<strong style={{ color: "#dc2626" }}>同一項目不可同時選為優勢與弱勢。</strong></p>
              <div style={S.row}>
                <div style={S.col}><label style={S.label}>填寫日期</label><input style={S.input} type="date" value={analysisDate} onChange={e => setAnalysisDate(e.target.value)} /></div>
                <div style={S.col}><label style={S.label}>填寫者</label><input style={S.input} value={analysisWriter} onChange={e => setAnalysisWriter(e.target.value)} placeholder="例：劉力瑄(教師)" /></div>
                <div style={S.col}><label style={S.label}>已選</label><div style={{ display: "flex", gap: 8, paddingTop: 8 }}><span style={S.badge("green")}>優勢 {strengths.length}</span><span style={S.badge("yellow")}>弱勢 {weaknesses.length}</span></div></div>
              </div>
              <h3 style={{ ...S.h3, marginTop: 20, color: "#059669" }}>🟢 優勢能力</h3>
              {[["認知特質", COG], ["情意特質", AFF], ["學科能力", SUB]].map(([l, t]) => (<div key={l}><div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{l}</div><div style={S.chipGroup}>{renderChips(t, true)}</div></div>))}
              <h3 style={{ ...S.h3, marginTop: 24, color: "#dc2626" }}>🔴 弱勢能力</h3>
              {[["認知特質", COG], ["情意特質", AFF], ["學科能力", SUB]].map(([l, t]) => (<div key={l}><div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>{l}</div><div style={S.chipGroup}>{renderChips(t, false)}</div></div>))}
            </div>
            <div style={S.card}>
              <h3 style={S.h3}>📝 會議紀錄 / 教師觀察</h3>
              <textarea style={{ ...S.textarea, minHeight: 150 }} value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} placeholder={"貼入老師、家長對學生的觀察..."} />
              <div style={{ marginTop: 16 }}><button style={S.btn("primary")} onClick={generateAnalysis} disabled={loading}>✨ AI 生成質性描述</button></div>
            </div>
            {analysisResult && (<div style={S.card}><h3 style={S.h3}>🎯 質性描述</h3><textarea style={{ ...S.textarea, minHeight: 200 }} value={analysisResult} onChange={e => setAnalysisResult(e.target.value)} /><p style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>✏️ 可直接編輯</p></div>)}
          </>)}
          {tab === "curriculum" && (<>
            <div style={S.card}>
              <h2 style={S.h2}>📚 四、課程需求評估 ＆ 五、教育目標與輔導重點</h2>
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 20px", border: "1px solid #e2e8f0", lineHeight: 2, fontSize: 13, color: "#374151" }}>
                上傳 ① 課程計畫 + ② 學生資料 → 一鍵生成<br/>✦ 學年/學期目標保留原文 ✦ 教育需求個別化 ✦ 學習表現保留108課綱編碼差異化
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
              <div style={{ ...S.card, flex: 1, marginBottom: 0 }}><h3 style={S.h3}>① 課程計畫 <span style={{ color: "#dc2626" }}>*</span></h3><UploadArea accept=".docx,.pdf,.png,.jpg,.jpeg" onFile={f => setCurrFile(f)} label="Word / PDF / 圖片" />{currFile && <div style={{ marginTop: 10 }}><span style={S.badge("green")}>✓ {currFile.name}</span></div>}</div>
              <div style={{ ...S.card, flex: 1, marginBottom: 0 }}><h3 style={S.h3}>② 學生 IGP 資料</h3><UploadArea accept=".docx,.pdf,.png,.jpg,.jpeg" onFile={f => setStudentFile(f)} label="會議紀錄 / 學生資料" />{studentFile && <div style={{ marginTop: 10 }}><span style={S.badge("green")}>✓ {studentFile.name}</span></div>}</div>
            </div>
            <div style={S.card}><h3 style={S.h3}>📋 學生概況文字（選填）</h3><textarea style={{ ...S.textarea, minHeight: 100 }} value={studentText} onChange={e => setStudentText(e.target.value)} placeholder="描述學生特質、學習狀況..." /></div>
            <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
              <button style={{ ...S.btn("primary"), padding: "16px 36px", fontSize: 16 }} onClick={generateCourses} disabled={loading}>🚀 一鍵生成個別化 IGP</button>
              {strengths.length > 0 && <span style={S.badge("green")}>優勢 {strengths.length}</span>}
              {weaknesses.length > 0 && <span style={S.badge("yellow")}>弱勢 {weaknesses.length}</span>}
            </div>
            {courses.length > 0 && (<>
              <div style={{ ...S.card, background: "linear-gradient(135deg,#ecfdf5,#f0fdf4)", border: "1.5px solid #86efac" }}><span style={{ fontSize: 24 }}>✅</span> 已生成 {courses.length} 門課程</div>
              {courses.map((c, i) => <CourseBlock key={i} course={c} idx={i} onUpdate={u => { const nc = [...courses]; nc[i] = u; setCourses(nc); }} />)}
            </>)}
          </>)}
          {tab === "meeting" && (<>
            <div style={S.card}><h2 style={S.h2}>📝 會議紀錄 OCR</h2><UploadArea accept=".png,.jpg,.jpeg,.webp" onFile={handleMeetingOcr} label="上傳手寫紀錄圖片（可多張）" multiple />{meetingImages.length > 0 && <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>{meetingImages.map((n, i) => <span key={i} style={S.badge("blue")}>📎 {n}</span>)}</div>}</div>
            {meetingOcrResult && <div style={S.card}><h3 style={S.h3}>📄 辨識結果</h3><textarea style={{ ...S.textarea, minHeight: 300 }} value={meetingOcrResult} onChange={e => setMeetingOcrResult(e.target.value)} /></div>}
            <div style={S.card}><h3 style={S.h3}>✍️ 手動輸入</h3><textarea style={{ ...S.textarea, minHeight: 150 }} value={meetingNotes} onChange={e => setMeetingNotes(e.target.value)} placeholder="輸入會議內容..." /></div>
          </>)}
          {tab === "counseling" && (<>
            <div style={S.card}><h2 style={S.h2}>💬 晤談輔導紀錄</h2><UploadArea accept=".png,.jpg,.jpeg,.webp,.pdf,.docx" onFile={handleCounselingUpload} label="上傳晤談紀錄（可多檔）" multiple />{counselingImages.length > 0 && <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>{counselingImages.map((n, i) => <span key={i} style={S.badge("blue")}>📎 {n}</span>)}</div>}</div>
            <div style={S.card}><h3 style={S.h3}>➕ 手動新增</h3><ManualForm onAdd={rec => setCounselingResult(prev => [...prev, rec])} /></div>
            {counselingResult.length > 0 && (<div style={S.card}><h3 style={S.h3}>📋 紀錄彙整（{counselingResult.length} 筆）</h3><div style={{ overflowX: "auto" }}><table style={S.table}><thead><tr><th style={S.th}>日期</th><th style={S.th}>人員</th><th style={S.th}>事件</th><th style={S.th}>內容</th><th style={S.th}>處遇</th><th style={{ ...S.th, width: 40 }}></th></tr></thead><tbody>{counselingResult.map((r, i) => (<tr key={i}><td style={S.td}>{r.date}</td><td style={S.td}>{r.participants}</td><td style={S.td}>{r.event}</td><td style={{ ...S.td, maxWidth: 300, whiteSpace: "pre-wrap" }}>{r.content}</td><td style={S.td}>{r.action}</td><td style={S.td}><button onClick={() => setCounselingResult(prev => prev.filter((_, j) => j !== i))} style={{ border: "none", background: "none", cursor: "pointer", color: "#ef4444" }}>✕</button></td></tr>))}</tbody></table></div></div>)}
          </>)}
        </main>
      </div>
    </>
  );
}

function ManualForm({ onAdd }) {
  const [f, setF] = useState({ date: "", participants: "", event: "", content: "", action: "持續觀察" });
  return (<div>
    <div style={S.row}><div style={S.col}><label style={S.label}>日期</label><input style={S.input} type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></div><div style={S.col}><label style={S.label}>參與人員</label><div style={{ display: "flex", gap: 6 }}>{["本人","母親","父親"].map(p => <span key={p} style={S.chip(f.participants.includes(p),"blue")} onClick={() => { const ps = f.participants ? f.participants.split("、") : []; setF({ ...f, participants: (ps.includes(p) ? ps.filter(x => x !== p) : [...ps, p]).join("、") }); }}>{p}</span>)}</div></div></div>
    <div style={{ marginBottom: 12 }}><label style={S.label}>事件</label><input style={S.input} value={f.event} onChange={e => setF({ ...f, event: e.target.value })} /></div>
    <div style={{ marginBottom: 12 }}><label style={S.label}>內容</label><textarea style={{ ...S.textarea, minHeight: 80 }} value={f.content} onChange={e => setF({ ...f, content: e.target.value })} /></div>
    <div style={{ marginBottom: 16 }}><label style={S.label}>處遇</label><div style={{ display: "flex", gap: 6 }}>{["轉介二級","協同導師","定期晤談","持續觀察"].map(a => <span key={a} style={S.chip(f.action === a,"blue")} onClick={() => setF({ ...f, action: a })}>{a}</span>)}</div></div>
    <button style={S.btn("success")} onClick={() => { if (!f.date) { alert("請填入日期"); return; } onAdd(f); setF({ date: "", participants: "", event: "", content: "", action: "持續觀察" }); }}>＋ 新增</button>
  </div>);
}
