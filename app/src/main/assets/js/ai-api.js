// ============================================================
// PHYSIO SUAI – AI API  (Google Gemini)
// ============================================================

const GEMINI_API_KEY = "AIzaSyCjNS_rM5u7ulqFaKKptCw_TfO668huY1U"; // ✅ Your key
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const PHYSIO_SYSTEM = `You are Physio AI, a helpful study assistant for physiotherapy students at SUAI.
Specialise in: anatomy, physiology, therapeutic exercises, clinical assessment, treatment protocols, 
medical terminology, and study guidance. Be concise, accurate and encouraging.`;

// ─── Main ask function ────────────────────────────────────────
async function askAI(question, context = null) {
  const prompt = context
    ? `${PHYSIO_SYSTEM}\n\nContext: ${context}\n\nQuestion: ${question}`
    : `${PHYSIO_SYSTEM}\n\nQuestion: ${question}`;

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!answer) throw new Error("Empty response");

    // Save to Firebase conversation history
    if (typeof db !== "undefined" && currentUser) {
      db.ref(`ai_chats/${currentUser.uid}`).push({
        question, answer, timestamp: Date.now()
      });
    }

    return { success: true, answer, provider: "Gemini" };

  } catch (err) {
    console.warn("Gemini error, using fallback:", err.message);
    return { success: true, answer: getPhysioFallback(question), provider: "Offline" };
  }
}

// ─── Physio fallback knowledge base ──────────────────────────
function getPhysioFallback(q) {
  q = q.toLowerCase();

  if (q.includes("muscle")) return "**Muscle groups** in physiotherapy:\n\n• **Upper limb**: deltoid, biceps, triceps, rotator cuff\n• **Lower limb**: quads, hamstrings, glutes, gastroc\n• **Core**: transversus abdominis, multifidus, pelvic floor\n\nAssessment: Manual Muscle Testing (MMT) grades 0–5.";
  if (q.includes("spine") || q.includes("back")) return "**Spine anatomy**:\n• Cervical: 7 vertebrae (C1–C7)\n• Thoracic: 12 vertebrae (T1–T12)\n• Lumbar: 5 vertebrae (L1–L5)\n• Sacrum + Coccyx\n\nCommon issues: disc herniation, scoliosis, stenosis, spondylolisthesis.";
  if (q.includes("joint")) return "**Joint types**:\n• Ball & socket: hip, shoulder\n• Hinge: knee, elbow, ankle\n• Pivot: atlantoaxial\n• Saddle: thumb CMC\n\nAssessment: goniometry for ROM measurement.";
  if (q.includes("exercise") || q.includes("rehab")) return "**Rehab exercise principles (FITT)**:\n• **Frequency**: 3–5×/week\n• **Intensity**: 60–80% 1RM for strength\n• **Time**: 20–60 min\n• **Type**: Strengthening, stretching, proprioception\n\nProgression: SAID principle (Specific Adaptation to Imposed Demands).";
  if (q.includes("pain")) return "**Pain Assessment Tools**:\n• VAS (Visual Analogue Scale) 0–10\n• NRS (Numeric Rating Scale)\n• McGill Pain Questionnaire\n• NPRS\n\nTypes: Nociceptive, Neuropathic, Nociplastic. Always assess onset, location, quality, radiation, severity.";
  if (q.includes("assess") || q.includes("exam")) return "**Physiotherapy Assessment (SOAP)**:\n• **S**ubjective: patient history, complaints\n• **O**bjective: observation, palpation, ROM, strength, special tests\n• **A**nalysis: diagnosis, problem list\n• **P**lan: treatment goals, interventions\n\nSpecial tests vary by joint/region.";
  if (q.includes("study") || q.includes("exam prep")) return "📚 **Study Tips for Physio Students**:\n\n1. Use spaced repetition for anatomy\n2. Draw and label structures\n3. Practice clinical reasoning with case studies\n4. Form study groups for peer teaching\n5. Relate theory to practice (clinical reasoning)\n6. Use this app to share notes! 😊";

  return "👋 Hi! I'm **Physio AI** (powered by Gemini).\n\nI can help with:\n🧬 Anatomy & physiology\n💪 Exercise prescription\n📋 Assessment techniques\n🩺 Treatment protocols\n📚 Study guidance\n\nAsk me anything specific!";
}

// ─── Physio tips for Study AI page ───────────────────────────
function getPhysiotherapyTips() {
  return [
    { title: "Posture While Studying", description: "Keep spine neutral, feet flat, screen at eye level. Take a break every 30 min.", category: "Ergonomics", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=220&fit=crop" },
    { title: "Core Strengthening", description: "Planks, bridges, bird-dogs. Start 3×10 reps. Core stability prevents 80% of low-back issues.", category: "Strength", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=220&fit=crop" },
    { title: "Hip Flexor Stretch", description: "Kneeling lunge, 30s hold each side. Combats prolonged sitting.", category: "Flexibility", image: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&h=220&fit=crop" },
    { title: "Diaphragmatic Breathing", description: "4 counts in, 6 counts out. Activates parasympathetic system, reduces anxiety before exams.", category: "Breathing", image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=220&fit=crop" },
  ];
}

console.log("✅ AI ready → Gemini (AIzaSyCjNS...)");
