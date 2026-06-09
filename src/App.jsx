import { useState, useEffect } from "react";
import { supabase } from './lib/supabase.js';
import { TERMS } from './data/terms.js';
import { getTrialPrompts } from './data/prompts-trial.js';
import { getPrompt } from './data/prompts-main.js';
import { BONUS_PROMPTS } from './data/prompts-bonus.js';

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400&family=DM+Sans:wght@300;400;500&display=swap";
document.head.appendChild(fontLink);

const style = document.createElement("style");
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; overflow: hidden; background: #FFF8F0; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
  .fade-up { animation: fadeUp 0.45s ease both; }
  .float { animation: float 4s ease-in-out infinite; }
  button { font-family: inherit; cursor: pointer; border: none; background: none; }
  button:active { transform: scale(0.97); transition: transform 0.1s; }
  input { font-family: inherit; outline: none; }
  .screen { position: absolute; inset: 0; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; }
  ::-webkit-scrollbar { width: 0; }
`;
document.head.appendChild(style);

const T = {
  bg: "#FFF8F0", card: "#FFFFFF", primary: "#7AB8D4", amber: "#F2A74B",
  coral: "#F28B6E", lavender: "#B8A9C9", text: "#2D2D2D", muted: "#8A9BAE",
  border: "rgba(122,184,212,0.2)", shadow: "0 4px 32px rgba(122,184,212,0.15), 0 1px 4px rgba(0,0,0,0.06)",
  shadowSm: "0 2px 12px rgba(122,184,212,0.12)",
};



const LANGUAGES = [
  { id: "en", flag: "🇺🇸", name: "English" },
  { id: "fr", flag: "🇫🇷", name: "Français" },
];

function detectLang() {
  const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
  return ["en","fr"].includes(nav) ? nav : "en";
}

const i18n = {
  en: {
    tagline: "Grow Kindly.", sub: "Small prompts for meaningful change and wellbeing.",
    hero1: "You don't need motivation.", hero2: "You need an interruption.",
    goodAfternoon: "Good afternoon 🌤️", goodEvening: "Good evening 🌙",
    desc: "Wami sends gentle, specific prompts through your day — helping you move, breathe, focus, connect and grow. Choose your focus areas, your rhythm, and let Wami handle the rest.",
    focus12: "12 focus areas", focusDesc: "Stress · Energy · Focus · Movement · Eating · Relationships · Sleep · Calm · Digital · Joy · Confidence · Creativity",
    frequency: "3 frequency levels", freqDesc: "Light (2×/week) · Steady (1×/day) · Present (3×/day)",
    trial: "Start free — 14 days", signin: "Already have an account? Sign in",
    onboardTitle: "Make it yours", onboardSub: "A few quick choices so your prompts feel personal.",
    ageLabel: "How do you see yourself?", kidsLabel: "Kids", workTypeLabel: "Type of work",
    focusLabel: "What would you like more of?", focusSub: "Choose up to 5 focus areas.",
    freqLabel: "How often would you like a nudge?", daysLabel: "Which days?", letsgo: "Let's go →",
    signupTitle: "Your profile is ready.", signupSub: "Create your account to save it and start exploring.",
    emailPlaceholder: "Your email", passwordPlaceholder: "Choose a password", createAccount: "Create account",
    paywallTitle: "Unlock the full experience.", paywallSub: "Hundreds of carefully crafted prompts across 12 focus areas. New every day.",
    unlockBtn: "Unlock all prompts", restore: "Restore purchase", terms: "Terms · Privacy",
    homeGreeting: "Good morning 🌅", todayPrompt: "Today's nudge", nextPrompt: "Next prompt",
    tunein: "Before your next prompt — take one breath and notice how you feel right now.",
    explore: "Explore", profile: "Profile", home: "Home",
    exploreTitle: "12 Focus Areas", exploreSub: "Tap any area to learn more.",
    profileTitle: "Your Wami", profileWorking: "Wami is quietly working for you.",
    editPrefs: "Edit preferences", yourFocus: "Your focus areas", yourFreq: "Frequency",
    yourDays: "Active days", language: "Language", subscription: "Subscription",
    manageSubscription: "Manage subscription",
    enableNotif: "🔔 Enable nudge notifications", enableNotifSub: "Receive prompts through your day",
    notifAllow: "Allow", notifEnabled: "✓ Notifications enabled — nudges are on their way",
    trialPill: "Free trial", trialPromptLabel: "Free trial prompt",
    unlockCta: "✨ Unlock hundreds of prompts", unlockCtaSub: "Across 12 focus areas.\nCarefully crafted for you.",
    seePlans: "See plans →",
    ages: ["Young", "Adult", "Senior"],
    kids: ["No kids", "Small kids", "Teenagers", "Grown-up kids"],
    workTypes: ["Office", "Physically demanding", "Other"],
    freqs: [
      { id: "light",   label: "Light",   desc: "2 nudges per week",  interval: 240 },
      { id: "steady",  label: "Steady",  desc: "1 nudge per day",    interval: 120 },
      { id: "present", label: "Present", desc: "3 nudges per day",   interval: 60  },
    ],
    dayNames: ["M","T","W","T","F","S","S"],
    focusAreas: [
      { id:"stress",        icon:"🌬️", label:"Less stress",          desc:"Breathe, release, find footing" },
      { id:"energy",        icon:"⚡",  label:"More energy",          desc:"Wake up from the inside" },
      { id:"focus",         icon:"🎯",  label:"Better focus",         desc:"Find your thread and follow it" },
      { id:"movement",      icon:"🏃",  label:"Move more",            desc:"Tiny invitations to move" },
      { id:"eating",        icon:"🥑",  label:"Eat better",           desc:"A kinder relationship with food" },
      { id:"relationships", icon:"🤝",  label:"Better relationships", desc:"Small gestures that keep people close" },
      { id:"sleep",         icon:"🌙",  label:"Sleep better",         desc:"Deeper, more restoring rest" },
      { id:"calm",          icon:"🌊",  label:"More calm & presence", desc:"Slow down, notice, arrive" },
      { id:"digital",       icon:"📵",  label:"Digital balance",      desc:"Reclaim your attention" },
      { id:"joy",           icon:"✨",  label:"Nourish joy & spirit", desc:"Wonder, beauty, meaning" },
      { id:"confidence",    icon:"🦋",  label:"Feel more confident",  desc:"Trust yourself a little more" },
      { id:"creativity",    icon:"🎨",  label:"More creativity",      desc:"Make, imagine, express" },
    ],
    monthly:  { label: "Monthly",  period: "/month", price: "€3.99", badge: "" },
    annual:   { label: "Annual",   period: "/year",  price: "€19",   badge: "Best value" },
    lifetime: { label: "Lifetime", period: "once",   price: "€59",   badge: "Forever" },
  },
  fr: {
    tagline: "Grandissez avec bienveillance.", sub: "De petites suggestions pour un changement significatif et le bien-être.",
    hero1: "Vous n'avez pas besoin de motivation.", hero2: "Vous avez besoin d'une interruption.",
    goodAfternoon: "Bon après-midi 🌤️", goodEvening: "Bonsoir 🌙",
    desc: "Wami vous envoie des suggestions douces et spécifiques tout au long de la journée — pour bouger, respirer, vous concentrer, vous connecter et grandir.",
    focus12: "12 domaines de focus", focusDesc: "Stress · Énergie · Focus · Mouvement · Alimentation · Relations · Sommeil · Calme · Digital · Joie · Confiance · Créativité",
    frequency: "3 niveaux de fréquence", freqDesc: "Léger (2×/semaine) · Régulier (1×/jour) · Présent (3×/jour)",
    trial: "Commencez gratuitement — 14 jours", signin: "Déjà un compte ? Connectez-vous",
    onboardTitle: "Personnalisez", onboardSub: "Quelques choix rapides pour que vos suggestions soient personnelles.",
    ageLabel: "Comment vous voyez-vous ?", kidsLabel: "Enfants", workTypeLabel: "Type de travail",
    focusLabel: "Que souhaiteriez-vous avoir davantage ?", focusSub: "Choisissez jusqu'à 5 domaines.",
    freqLabel: "À quelle fréquence souhaitez-vous une suggestion ?", daysLabel: "Quels jours ?", letsgo: "C'est parti →",
    signupTitle: "Votre profil est prêt.", signupSub: "Créez votre compte pour le sauvegarder et commencer.",
    emailPlaceholder: "Votre email", passwordPlaceholder: "Choisissez un mot de passe", createAccount: "Créer un compte",
    paywallTitle: "Débloquez l'expérience complète.", paywallSub: "Des centaines de suggestions soigneusement créées dans 12 domaines. Nouvelles chaque jour.",
    unlockBtn: "Débloquer toutes les suggestions", restore: "Restaurer l'achat", terms: "Conditions · Confidentialité",
    homeGreeting: "Bonjour 🌅", todayPrompt: "Votre suggestion", nextPrompt: "Prochaine suggestion",
    tunein: "Avant votre prochaine suggestion — respirez profondément et remarquez comment vous vous sentez.",
    explore: "Explorer", profile: "Profil", home: "Accueil",
    exploreTitle: "12 Domaines de Focus", exploreSub: "Appuyez sur un domaine pour en savoir plus.",
    profileTitle: "Votre Wami", profileWorking: "Wami travaille silencieusement pour vous.",
    editPrefs: "Modifier les préférences", yourFocus: "Vos domaines de focus", yourFreq: "Fréquence",
    yourDays: "Jours actifs", language: "Langue", subscription: "Abonnement",
    manageSubscription: "Gérer l'abonnement",
    enableNotif: "🔔 Activer les notifications", enableNotifSub: "Recevez des suggestions tout au long de la journée",
    notifAllow: "Autoriser", notifEnabled: "✓ Notifications activées — vos suggestions arrivent",
    trialPill: "Essai gratuit", trialPromptLabel: "Suggestion d'essai gratuit",
    unlockCta: "✨ Débloquer des centaines de suggestions", unlockCtaSub: "Dans 12 domaines.\nSoigneusement créées pour vous.",
    seePlans: "Voir les offres →",
    ages: ["Jeune", "Adulte", "Senior"],
    kids: ["Sans enfants", "Petits enfants", "Adolescents", "Grands enfants"],
    workTypes: ["Bureau", "Physiquement exigeant", "Autre"],
    freqs: [
      { id: "light",   label: "Léger",    desc: "2 suggestions par semaine", interval: 240 },
      { id: "steady",  label: "Régulier", desc: "1 suggestion par jour",     interval: 120 },
      { id: "present", label: "Présent",  desc: "3 suggestions par jour",    interval: 60  },
    ],
    dayNames: ["L","M","M","J","V","S","D"],
    focusAreas: [
      { id:"stress",        icon:"🌬️", label:"Moins de stress",        desc:"Respirez, relâchez, trouvez l'équilibre" },
      { id:"energy",        icon:"⚡",  label:"Plus d'énergie",         desc:"Réveillez-vous de l'intérieur" },
      { id:"focus",         icon:"🎯",  label:"Meilleur focus",         desc:"Trouvez votre fil et suivez-le" },
      { id:"movement",      icon:"🏃",  label:"Bougez plus",            desc:"Petites invitations à bouger" },
      { id:"eating",        icon:"🥑",  label:"Mieux manger",           desc:"Une relation plus douce avec la nourriture" },
      { id:"relationships", icon:"🤝",  label:"Meilleures relations",   desc:"Petits gestes qui rapprochent" },
      { id:"sleep",         icon:"🌙",  label:"Mieux dormir",           desc:"Un repos plus profond" },
      { id:"calm",          icon:"🌊",  label:"Calme et présence",      desc:"Ralentissez, remarquez, arrivez" },
      { id:"digital",       icon:"📵",  label:"Équilibre numérique",    desc:"Récupérez votre attention" },
      { id:"joy",           icon:"✨",  label:"Joie et esprit",         desc:"Émerveillement, beauté, sens" },
      { id:"confidence",    icon:"🦋",  label:"Plus de confiance",      desc:"Faites-vous confiance un peu plus" },
      { id:"creativity",    icon:"🎨",  label:"Plus de créativité",     desc:"Créez, imaginez, exprimez" },
    ],
    monthly:  { label: "Mensuel",  period: "/mois",          price: "3,99 €", badge: "" },
    annual:   { label: "Annuel",   period: "/an",            price: "19 €",   badge: "Meilleure offre" },
    lifetime: { label: "À vie",    period: "paiement unique", price: "59 €",  badge: "Pour toujours" },
  },
};

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function WamiLogo({ size = 38 }) {
  return <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: size, fontWeight: 800, color: T.amber, letterSpacing: "-1px", lineHeight: 1, textShadow: "0 2px 8px rgba(242,167,75,0.25)" }}>wami</div>;
}
function WamiHero() {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 52, fontWeight: 800, color: T.amber, letterSpacing: "-1px", lineHeight: 1, textShadow: "0 2px 12px rgba(242,167,75,0.3)" }}>wami</div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, color: T.amber, marginTop: 1, letterSpacing: "0.3px", textTransform: "capitalize" }}>Grow Kindly.</div>
    </div>
  );
}
function SunOrb({ size = 80, style: s = {} }) {
  return <div className="float" style={{ width: size, height: size, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #FFE4A0, #F2A74B 60%, #F28B6E)", boxShadow: "0 8px 32px rgba(242,167,75,0.4)", flexShrink: 0, ...s }} />;
}
function Pill({ children, color = T.amber }) {
  return <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, color: "white", background: color, borderRadius: 20, padding: "3px 10px", letterSpacing: "0.5px", textTransform: "uppercase" }}>{children}</span>;
}
function PrimaryBtn({ children, onClick, disabled, style: s = {} }) {
  return <button onClick={onClick} disabled={disabled} style={{ background: disabled ? "#ccc" : `linear-gradient(135deg, ${T.amber}, ${T.coral})`, color: "white", borderRadius: 16, padding: "15px 24px", fontSize: 15, fontWeight: 700, fontFamily: "'Nunito', sans-serif", width: "100%", boxShadow: disabled ? "none" : "0 4px 20px rgba(242,167,75,0.4)", cursor: disabled ? "not-allowed" : "pointer", ...s }}>{children}</button>;
}
function Card({ children, style: s = {} }) {
  return <div style={{ background: T.card, borderRadius: 24, padding: "24px 20px", boxShadow: T.shadow, ...s }}>{children}</div>;
}
function SelectPill({ label, selected, onClick }) {
  return <button onClick={onClick} style={{ background: selected ? T.amber : "#F5F0E8", color: selected ? "white" : T.text, border: `2px solid ${selected ? T.amber : "transparent"}`, borderRadius: 12, padding: "8px 14px", fontSize: 13, fontWeight: 600, fontFamily: "'Nunito', sans-serif", transition: "all 0.2s", marginBottom: 6, marginRight: 6 }}>{label}</button>;
}
function LangPicker({ lang, onSelect }) {
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.id === lang) || LANGUAGES[0];
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ background: "rgba(255,255,255,0.9)", borderRadius: 12, padding: "6px 12px", fontSize: 13, fontWeight: 600, fontFamily: "'Nunito', sans-serif", color: T.text, display: "flex", alignItems: "center", gap: 6, boxShadow: T.shadowSm }}>
        {current.flag} {current.id.toUpperCase()} ▾
      </button>
      {open && (
        <div style={{ position: "absolute", top: "110%", right: 0, background: "white", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", overflow: "hidden", zIndex: 100, minWidth: 160 }}>
          {LANGUAGES.map(l => (
            <button key={l.id} onClick={() => { onSelect(l.id); setOpen(false); }} style={{ display: "block", width: "100%", padding: "12px 16px", textAlign: "left", fontSize: 14, fontWeight: l.id === lang ? 700 : 400, fontFamily: "'Nunito', sans-serif", color: l.id === lang ? T.amber : T.text, background: l.id === lang ? "#FFF8F0" : "white", borderBottom: "1px solid #F5F0E8" }}>
              {l.flag} {l.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function BottomNav({ active, onNav, t }) {
  const tabs = [{ id:"home", icon:"🏠", label:t.home }, { id:"explore", icon:"🔍", label:t.explore }, { id:"profile", icon:"👤", label:t.profile }];
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderTop: `1px solid ${T.border}`, display: "flex", zIndex: 50 }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onNav(tab.id)} style={{ flex: 1, padding: "12px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active === tab.id ? T.amber : T.muted, transition: "color 0.2s" }}>
          <div style={{ fontSize: 20 }}>{tab.icon}</div>
          <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>{tab.label}</div>
        </button>
      ))}
    </div>
  );
}

// ─── TERMS MODAL ──────────────────────────────────────────────────────────────
function TermsModal({ onClose, onAccept, mustAccept = false, lang = "en" }) {
  const [accepted, setAccepted] = useState(false);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "24px 24px 0 0", padding: "28px 24px 48px", maxWidth: 420, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 800, color: T.text }}>Terms & Privacy · Conditions & Confidentialité</div>
          {!mustAccept && <button onClick={onClose} style={{ fontSize: 22, color: T.muted, fontWeight: 700 }}>×</button>}
        </div>
        <div style={{ fontSize: 13, color: T.text, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.8 }}>
          {TERMS.map(clause => (
            <div key={clause.id}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontFamily: "'Nunito', sans-serif" }}>
                {clause.id}. {clause.title} · {clause.titleFr}
              </div>
              <p style={{ marginBottom: 4 }}>{clause.en}</p>
              <p style={{ marginBottom: 16, fontStyle: "italic", color: T.muted }}>{clause.fr}</p>
            </div>
          ))}
        </div>
        {mustAccept && (
          <div style={{ marginTop: 20 }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", marginBottom: 20 }}>
              <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0, accentColor: T.amber }} />
              <span style={{ fontSize: 13, color: T.text, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
                I have read and agree to the Terms & Conditions. · J'ai lu et j'accepte les Conditions Générales. I understand that Wami is not a medical service and I use it at my own risk. · Je comprends que Wami n'est pas un service médical et que je l'utilise à mes propres risques.
              </span>
            </label>
            <button onClick={() => { if (accepted) { onAccept(); onClose(); } }}
              style={{ background: accepted ? `linear-gradient(135deg, ${T.amber}, ${T.coral})` : "#ccc", color: "white", borderRadius: 16, padding: "15px 24px", fontSize: 15, fontWeight: 700, fontFamily: "'Nunito', sans-serif", width: "100%", cursor: accepted ? "pointer" : "not-allowed" }}>
              I agree · J'accepte
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN: LANDING ──────────────────────────────────────────────────────────
function LandingScreen({ lang, setLang, onStart, onSignIn, onShowTerms }) {
  const t = i18n[lang] || i18n.en;
  return (
    <div className="screen" style={{ background: "linear-gradient(180deg, #FFF3D0 0%, #FFE8A0 20%, #D4EDF8 70%, #C0E4F5 100%)" }}>
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, #FFF3D0 0%, #FFE8A0 20%, #D4EDF8 70%, #C0E4F5 100%)", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 420, margin: "0 auto", padding: "20px 20px 48px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <LangPicker lang={lang} onSelect={setLang} />
        </div>
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ marginBottom: 20 }}><WamiHero /></div>
          <SunOrb size={90} style={{ margin: "0 auto 28px" }} />
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 700, color: "#4A4A4A", lineHeight: 1.2, marginBottom: 8 }}>{t.hero1}</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 24, fontWeight: 700, color: "#888888", lineHeight: 1.2, marginBottom: 24 }}>{t.hero2}</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: "#4A6070", lineHeight: 1.65, fontFamily: "'DM Sans', sans-serif", marginBottom: 32 }}>{t.desc}</div>
        </div>
        <div className="fade-up" style={{ animationDelay: "0.1s", marginBottom: 28 }}>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ fontSize: 28 }}>🎯</div>
              <div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>{t.focus12}</div>
                <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{t.focusDesc}</div>
              </div>
            </div>
          </Card>
          <Card>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ fontSize: 28 }}>⏰</div>
              <div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>{t.frequency}</div>
                <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{t.freqDesc}</div>
              </div>
            </div>
          </Card>
        </div>
        <div className="fade-up" style={{ animationDelay: "0.15s", marginBottom: 28 }}>
          <div style={{ background: "linear-gradient(135deg, rgba(122,184,212,0.1), rgba(242,167,75,0.08))", border: `1.5px solid ${T.border}`, borderRadius: 20, padding: "20px" }}>
            <Pill color={T.primary}>Sample nudge</Pill>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, fontStyle: "italic", fontWeight: 600, color: T.text, lineHeight: 1.55, marginTop: 12, whiteSpace: "pre-line" }}>
              {"Before your next thing, pause for a glass of water. A soft reset.\nAvant la prochaine chose, faites une pause pour un verre d'eau. Une douce remise à zéro."}
            </div>
          </div>
        </div>
        <div className="fade-up" style={{ animationDelay: "0.2s" }}>
          <PrimaryBtn onClick={onStart}>{t.trial}</PrimaryBtn>
          <button onClick={onSignIn} style={{ color: T.muted, fontSize: 13, fontWeight: 400, fontFamily: "'DM Sans', sans-serif", width: "100%", padding: "10px", marginTop: 8 }}>{t.signin}</button>
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>
            <button onClick={onShowTerms} style={{ color: T.muted, fontSize: 11, fontFamily: "'DM Sans', sans-serif", textDecoration: "underline" }}>{t.terms}</button>
          </div>
          {/* Social links */}
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 20 }}>
            <a href="https://www.instagram.com/joinwami.me" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans', sans-serif", textDecoration: "underline" }}>
              Instagram
            </a>
            <a href="https://www.facebook.com/share/1JqFp6qbhK/?mibextid=XIfr" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans', sans-serif", textDecoration: "underline" }}>
              Facebook
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INSTALL DETECTION ────────────────────────────────────────────────────────
function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
function isAndroid() { return /android/i.test(navigator.userAgent); }
function isStandalone() { return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; }
function needsInstall() { return (isIOS() || isAndroid()) && !isStandalone(); }

// ─── SCREEN: INSTALL GUIDE ────────────────────────────────────────────────────
function InstallScreen({ onContinue }) {
  const ios = isIOS();
  const steps = ios ? [
    { icon: "1️⃣", text: "Open wami.me in Safari", detail: "Important: you must use Safari. Chrome and other browsers on iPhone do not support installation." },
    { icon: "2️⃣", text: "Tap the Share button", detail: "It is a square with an arrow pointing upward ↑. You will find it at the top or bottom of the Safari screen." },
    { icon: "3️⃣", text: "Tap \"Add to Home Screen\"", detail: "Scroll the share menu until you find it, then tap it." },
    { icon: "4️⃣", text: "Tap \"Add\" to confirm", detail: "Wami will appear as an icon on your home screen." },
    { icon: "5️⃣", text: "Open Wami from your home screen", detail: "Then come back here and tap Continue below." },
  ] : [
    { icon: "1️⃣", text: "Tap the menu button ⋮ in Chrome", detail: "Top right corner of your browser." },
    { icon: "2️⃣", text: "Tap \"Add to Home screen\"", detail: "Or \"Install app\" if you see that option." },
    { icon: "3️⃣", text: "Tap \"Add\" to confirm", detail: "Wami will appear as an app on your home screen." },
    { icon: "4️⃣", text: "Open Wami from your home screen", detail: "Then come back here and tap Continue below." },
  ];
  return (
    <div className="screen" style={{ background: "linear-gradient(180deg, #FFF3D0 0%, #E8F4FD 100%)" }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "32px 20px 48px" }}>
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 32 }}>
          <WamiHero />
          <SunOrb size={64} style={{ margin: "24px auto 24px" }} />
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 8, lineHeight: 1.3 }}>Install Wami for the best experience</div>
          <div style={{ fontSize: 14, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>Installing takes 30 seconds and enables nudge notifications throughout your day.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{ background: ios ? "#1D1D1F" : "#4285F4", color: "white", borderRadius: 20, padding: "6px 16px", fontSize: 12, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
            {ios ? "🍎 iPhone / iPad — Safari" : "🤖 Android — Chrome"}
          </div>
        </div>
        <div style={{ marginBottom: 28 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ background: "white", borderRadius: 16, padding: "16px", marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 14, boxShadow: T.shadowSm }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 3 }}>{s.text}</div>
                <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
        <PrimaryBtn onClick={onContinue}>I've installed Wami — Continue →</PrimaryBtn>
        <button onClick={onContinue} style={{ display: "block", width: "100%", marginTop: 12, fontSize: 13, color: T.muted, fontFamily: "'DM Sans', sans-serif", textAlign: "center", padding: "8px" }}>Skip for now (notifications may not work)</button>
      </div>
    </div>
  );
}

// ─── SCREEN: ONBOARDING ───────────────────────────────────────────────────────
function OnboardingScreen({ lang, setLang, onComplete }) {
  const t = i18n[lang] || i18n.en;
  const [age, setAge] = useState(null);
  const [kids, setKids] = useState(null);
  const [workTypes, setWorkTypes] = useState([]);
  const [focuses, setFocuses] = useState([]);
  const [freq, setFreq] = useState("steady");
  const [days, setDays] = useState([0,1,2,3,4]);
  const toggleWorkType = (i) => setWorkTypes(w => w.includes(i) ? w.filter(x => x !== i) : [...w, i]);
  const toggleFocus = (id) => setFocuses(f => f.includes(id) ? f.filter(x => x !== id) : f.length < 5 ? [...f, id] : f);
  const toggleDay = (i) => setDays(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i]);
  const ready = focuses.length > 0 && days.length > 0;
  return (
    <div className="screen" style={{ background: "linear-gradient(180deg, #FFF3D0 0%, #E8F4FD 100%)" }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "24px 20px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <WamiLogo />
          <LangPicker lang={lang} onSelect={setLang} />
        </div>
        <div className="fade-up">
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 4 }}>{t.onboardTitle}</div>
          <div style={{ fontSize: 14, color: T.muted, fontFamily: "'DM Sans', sans-serif", marginBottom: 24, lineHeight: 1.5 }}>{t.onboardSub}</div>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>{t.ageLabel}</div>
              <div style={{ display: "flex", flexWrap: "wrap" }}>{t.ages.map((a, i) => <SelectPill key={i} label={a} selected={age === i} onClick={() => setAge(i)} />)}</div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>{t.kidsLabel}</div>
              <div style={{ display: "flex", flexWrap: "wrap" }}>{t.kids.map((k, i) => <SelectPill key={i} label={k} selected={kids === i} onClick={() => setKids(i)} />)}</div>
            </div>
            <div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>{t.workTypeLabel}</div>
              <div style={{ display: "flex", flexWrap: "wrap" }}>{t.workTypes.map((w, i) => <SelectPill key={i} label={w} selected={workTypes.includes(i)} onClick={() => toggleWorkType(i)} />)}</div>
            </div>
          </Card>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{t.focusLabel}</div>
            <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans', sans-serif", marginBottom: 14 }}>{t.focusSub}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {t.focusAreas.map(f => (
                <button key={f.id} onClick={() => toggleFocus(f.id)} style={{ background: focuses.includes(f.id) ? "rgba(242,167,75,0.12)" : "#F9F5EF", border: `2px solid ${focuses.includes(f.id) ? T.amber : "transparent"}`, borderRadius: 14, padding: "12px 10px", textAlign: "left", transition: "all 0.2s" }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{f.icon}</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{f.label}</div>
                </button>
              ))}
            </div>
          </Card>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }}>{t.freqLabel}</div>
            {t.freqs.map(f => (
              <button key={f.id} onClick={() => setFreq(f.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: freq === f.id ? "rgba(122,184,212,0.1)" : "#F9F5EF", border: `2px solid ${freq === f.id ? T.primary : "transparent"}`, borderRadius: 14, padding: "14px 16px", marginBottom: 8, transition: "all 0.2s" }}>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: T.text }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>{f.desc}</div>
                </div>
                {freq === f.id && <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11 }}>✓</div>}
              </button>
            ))}
          </Card>
          <Card style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 14 }}>{t.daysLabel}</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {t.dayNames.map((d, i) => (
                <button key={i} onClick={() => toggleDay(i)} style={{ width: 38, height: 38, borderRadius: "50%", background: days.includes(i) ? T.amber : "#F0EBE0", color: days.includes(i) ? "white" : T.muted, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, transition: "all 0.2s" }}>{d}</button>
              ))}
            </div>
          </Card>
          <PrimaryBtn onClick={() => onComplete({ age, kids, workTypes, focuses, freq, days })} disabled={!ready}>{t.letsgo}</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: SIGN IN ──────────────────────────────────────────────────────────
function SignInScreen({ lang, onComplete }) {
  const t = i18n[lang] || i18n.en;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSignIn = async () => {
    if (!email.includes("@")) { setError("Please enter a valid email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError(""); setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      onComplete();
    } catch (e) { setError("Something went wrong. Please try again."); setLoading(false); }
  };

  const handleReset = async () => {
    if (!email.includes("@")) { setError("Please enter your email address first."); return; }
    setError(""); setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://www.wami.me',
      });
      if (error) { setError(error.message); setLoading(false); return; }
      setResetSent(true); setLoading(false);
    } catch (e) { setError("Something went wrong. Please try again."); setLoading(false); }
  };

  return (
    <div className="screen" style={{ background: "linear-gradient(180deg, #FFF3D0 0%, #E8F4FD 100%)" }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "32px 20px 48px" }}>
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 36 }}>
          <WamiHero />
          <SunOrb size={60} style={{ margin: "24px auto 24px" }} />
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 700, color: "#4A4A4A", marginBottom: 8 }}>
            {resetMode ? "Reset your password" : "Welcome back."}
          </div>
          <div style={{ fontSize: 14, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
            {resetMode ? "Enter your email and we'll send you a reset link." : "Sign in to continue your journey."}
          </div>
        </div>

        {resetSent ? (
          <div className="fade-up" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📬</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 8 }}>Check your inbox</div>
            <div style={{ fontSize: 13, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, marginBottom: 20 }}>
              A password reset link has been sent to <strong>{email}</strong>. Follow the link to set a new password.
            </div>
            <div style={{ fontSize: 11, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7, padding: "12px 16px", background: "#F9F5EF", borderRadius: 12, marginBottom: 20, textAlign: "left" }}>
              This is an automated message — please do not reply. To get in touch, find us on Instagram and Facebook at wami.me
            </div>
            <button onClick={() => { setResetMode(false); setResetSent(false); }}
              style={{ fontSize: 13, color: T.primary, fontFamily: "'DM Sans', sans-serif", textDecoration: "underline" }}>
              Back to sign in
            </button>
          </div>
        ) : (
          <div className="fade-up" style={{ animationDelay: "0.1s" }}>
            <input type="email" placeholder={t.emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)}
              style={{ display: "block", width: "100%", background: "white", border: `1.5px solid ${T.border}`, borderRadius: 14, padding: "14px 16px", fontSize: 14, color: T.text, marginBottom: 12, boxShadow: T.shadowSm }} />
            {!resetMode && (
              <input type="password" placeholder={t.passwordPlaceholder} value={password} onChange={e => setPassword(e.target.value)}
                style={{ display: "block", width: "100%", background: "white", border: `1.5px solid ${T.border}`, borderRadius: 14, padding: "14px 16px", fontSize: 14, color: T.text, marginBottom: 12, boxShadow: T.shadowSm }} />
            )}
            {error && <div style={{ fontSize: 12, color: T.coral, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>{error}</div>}
            <PrimaryBtn onClick={resetMode ? handleReset : handleSignIn} disabled={loading}>
              {loading ? "Please wait..." : resetMode ? "Send reset link" : "Sign in"}
            </PrimaryBtn>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button onClick={() => { setResetMode(!resetMode); setError(""); }}
                style={{ fontSize: 12, color: T.primary, fontFamily: "'DM Sans', sans-serif", textDecoration: "underline" }}>
                {resetMode ? "Back to sign in" : "Forgot password?"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN: SIGN UP ──────────────────────────────────────────────────────────
function SignUpScreen({ lang, onComplete }) {
  const t = i18n[lang] || i18n.en;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleCreate = async () => {
    if (!email.includes("@")) { setError("Please enter a valid email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError("");
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); return; }
      onComplete();
    } catch (e) { setError("Something went wrong. Please try again."); }
  };

  return (
    <div className="screen" style={{ background: "linear-gradient(180deg, #FFF3D0 0%, #E8F4FD 100%)" }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "32px 20px 48px" }}>
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 36 }}>
          <WamiHero />
          <SunOrb size={60} style={{ margin: "24px auto 24px" }} />
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 700, color: "#4A4A4A", marginBottom: 8 }}>{t.signupTitle}</div>
          <div style={{ fontSize: 14, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>{t.signupSub}</div>
        </div>
        <div className="fade-up" style={{ animationDelay: "0.1s" }}>
          <input type="email" placeholder={t.emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)} style={{ display: "block", width: "100%", background: "white", border: `1.5px solid ${T.border}`, borderRadius: 14, padding: "14px 16px", fontSize: 14, color: T.text, marginBottom: 12, boxShadow: T.shadowSm }} />
          <input type="password" placeholder={t.passwordPlaceholder} value={password} onChange={e => setPassword(e.target.value)} style={{ display: "block", width: "100%", background: "white", border: `1.5px solid ${T.border}`, borderRadius: 14, padding: "14px 16px", fontSize: 14, color: T.text, marginBottom: 12, boxShadow: T.shadowSm }} />
          {error && <div style={{ fontSize: 12, color: T.coral, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>{error}</div>}
          {!termsAccepted ? (
            <PrimaryBtn onClick={() => setShowTerms(true)}>Review & Accept Terms</PrimaryBtn>
          ) : (
            <PrimaryBtn onClick={handleCreate}>{t.createAccount}</PrimaryBtn>
          )}
          {termsAccepted && (
            <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: T.primary, fontFamily: "'DM Sans', sans-serif" }}>✓ Terms accepted</div>
          )}
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
            One account per email. 14-day free trial included.
          </div>
        </div>
      </div>
      {showTerms && (
        <TermsModal lang={lang} mustAccept={true} onAccept={() => setTermsAccepted(true)} onClose={() => setShowTerms(false)} />
      )}
    </div>
  );
}

// ─── SCREEN: HOME ─────────────────────────────────────────────────────────────
function HomeScreen({ lang, setLang, profile, showWelcome, onDismissWelcome, onUnlock, isTrial, dailyPrompt }) {
  const t = i18n[lang] || i18n.en;
  const trialPool = useState(() => getTrialPrompts(profile?.focuses))[0];
  const [notifStatus, setNotifStatus] = useState("default");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.homeGreeting : hour < 17 ? t.goodAfternoon : t.goodEvening;
  const requestNotifications = async () => {
    try {
      if (!("Notification" in window)) { setNotifStatus("unsupported"); return; }
      const perm = await Notification.requestPermission();
      setNotifStatus(perm);
      if (perm === "granted") { try { new Notification("Wami 🌿", { body: "Gentle nudges are on their way. Grow kindly." }); } catch(e) {} }
    } catch(e) { setNotifStatus("unsupported"); }
  };
  const promptText = isTrial ? trialPool[0]?.text : dailyPrompt?.text;
  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ background: "linear-gradient(180deg, #FFF3D0 0%, #D4EDF8 100%)", padding: "28px 20px 32px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(242,167,75,0.2), transparent)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, position: "relative" }}>
          <WamiLogo />
          <LangPicker lang={lang} onSelect={setLang} />
        </div>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 2 }}>{greeting}</div>
        <div style={{ fontSize: 13, color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>
          {profile?.focuses?.length || 0} focus {profile?.focuses?.length === 1 ? "area" : "areas"} · {t.freqs?.find(f => f.id === profile?.freq)?.label || "Steady"}
        </div>
      </div>
      <div style={{ padding: "20px" }}>
        {showWelcome && (
          <div className="fade-up" style={{ background: "linear-gradient(135deg, rgba(242,167,75,0.15), rgba(122,184,212,0.1))", border: `1.5px solid ${T.amber}`, borderRadius: 20, padding: "18px 20px", marginBottom: 16, position: "relative" }}>
            <button onClick={onDismissWelcome} style={{ position: "absolute", top: 12, right: 14, fontSize: 18, color: T.muted, fontWeight: 700 }}>×</button>
            <div style={{ fontSize: 22, marginBottom: 8 }}>🌅</div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 4 }}>{lang === "fr" ? "Bienvenue sur Wami." : "Welcome to Wami."}</div>
            <div style={{ fontSize: 13, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
              {isTrial
                ? (lang === "fr" ? `Votre essai gratuit a commencé. Vous avez ${trialPool.length} suggestions à explorer.` : `Your free trial has started. You have ${trialPool.length} curated prompts to explore.`)
                : (lang === "fr" ? "Votre bibliothèque complète est débloquée. Grandissez avec bienveillance. 🌿" : "Your full prompt library is unlocked. Grow kindly. 🌿")
              }
            </div>
          </div>
        )}
        {notifStatus === "default" && (
          <button onClick={requestNotifications} className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "linear-gradient(135deg, rgba(184,169,201,0.15), rgba(122,184,212,0.1))", border: `1.5px solid rgba(184,169,201,0.4)`, borderRadius: 20, padding: "14px 18px", marginBottom: 12, textAlign: "left" }}>
            <div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{t.enableNotif}</div>
              <div style={{ fontSize: 11, color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>{t.enableNotifSub}</div>
            </div>
            <div style={{ background: T.primary, color: "white", borderRadius: 10, padding: "6px 12px", fontSize: 11, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>{t.notifAllow}</div>
          </button>
        )}
        {notifStatus === "granted" && (
          <div className="fade-up" style={{ background: "rgba(122,184,212,0.1)", border: `1.5px solid rgba(122,184,212,0.3)`, borderRadius: 16, padding: "12px 16px", marginBottom: 12, fontSize: 12, color: T.primary, fontFamily: "'DM Sans', sans-serif" }}>
            {t.notifEnabled}
          </div>
        )}
        <Card style={{ marginBottom: 16, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: "radial-gradient(circle, rgba(242,167,75,0.1), transparent)", borderRadius: "0 24px 0 80px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <Pill color={isTrial ? T.primary : T.amber}>{isTrial ? t.trialPill : t.todayPrompt}</Pill>
          </div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 17, fontStyle: "italic", fontWeight: 600, color: T.text, lineHeight: 1.7, marginBottom: 20, minHeight: 80, whiteSpace: "pre-line" }}>
            "{promptText}"
          </div>
          <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>
            {isTrial ? t.trialPromptLabel : `${t.nextPrompt}: later today`}
          </div>
        </Card>
        {isTrial && (
          <button onClick={onUnlock} className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "linear-gradient(135deg, rgba(242,167,75,0.12), rgba(122,184,212,0.1))", border: `1.5px solid ${T.amber}`, borderRadius: 20, padding: "16px 20px", marginBottom: 16, textAlign: "left" }}>
            <div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 3 }}>{t.unlockCta}</div>
              <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans', sans-serif", whiteSpace: "pre-line" }}>{t.unlockCtaSub}</div>
            </div>
            <div style={{ background: `linear-gradient(135deg, ${T.amber}, ${T.coral})`, color: "white", borderRadius: 12, padding: "8px 14px", fontSize: 12, fontWeight: 700, fontFamily: "'Nunito', sans-serif", boxShadow: "0 2px 12px rgba(242,167,75,0.3)", whiteSpace: "nowrap" }}>{t.seePlans}</div>
          </button>
        )}
        <div style={{ background: "linear-gradient(135deg, rgba(184,169,201,0.15), rgba(122,184,212,0.1))", border: `1.5px solid rgba(184,169,201,0.3)`, borderRadius: 20, padding: "18px", marginBottom: 16 }}>
          <div style={{ fontSize: 18, marginBottom: 8 }}>🫧</div>
          <div style={{ fontSize: 13, color: T.text, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6, fontStyle: "italic" }}>{t.tunein}</div>
        </div>
        {profile?.focuses?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 10, letterSpacing: "0.5px", textTransform: "uppercase" }}>Your focus</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {profile.focuses.map(fid => {
                const f = t.focusAreas.find(a => a.id === fid);
                if (!f) return null;
                return <div key={fid} style={{ background: "white", border: `1.5px solid ${T.border}`, borderRadius: 12, padding: "6px 12px", fontSize: 12, fontWeight: 600, fontFamily: "'Nunito', sans-serif", color: T.text, display: "flex", alignItems: "center", gap: 6, boxShadow: T.shadowSm }}>{f.icon} {f.label}</div>;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SCREEN: EXPLORE ──────────────────────────────────────────────────────────
function ExploreScreen({ lang, profile }) {
  const t = i18n[lang] || i18n.en;
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: "28px 20px 20px" }}>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 4 }}>{t.exploreTitle}</div>
        <div style={{ fontSize: 14, color: T.muted, fontFamily: "'DM Sans', sans-serif", marginBottom: 24 }}>{t.exploreSub}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {t.focusAreas.map(f => {
            const isActive = profile?.focuses?.includes(f.id);
            const isOpen = selected === f.id;
            return (
              <div key={f.id}>
                <button onClick={() => setSelected(isOpen ? null : f.id)} style={{ width: "100%", background: isActive ? "rgba(242,167,75,0.1)" : "white", border: `2px solid ${isActive ? T.amber : T.border}`, borderRadius: 18, padding: "16px 14px", textAlign: "left", boxShadow: T.shadowSm, transition: "all 0.2s", position: "relative" }}>
                  {isActive && <div style={{ position: "absolute", top: 8, right: 8, width: 16, height: 16, borderRadius: "50%", background: T.amber, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "white", fontWeight: 700 }}>✓</div>}
                  <div style={{ fontSize: 26, marginBottom: 8 }}>{f.icon}</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4, lineHeight: 1.3 }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}>{f.desc}</div>
                </button>
                {isOpen && <div style={{ background: "white", border: `1.5px solid ${T.border}`, borderRadius: "0 0 16px 16px", padding: "12px 14px", marginTop: -8, fontSize: 12, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>{f.desc}. {isActive ? "✓ Active in your profile." : "Add in your profile settings."}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: PROFILE ──────────────────────────────────────────────────────────
function ProfileScreen({ lang, setLang, profile, onEdit, onManageSubscription, isTrial, onSignOut }) {
  const t = i18n[lang] || i18n.en;
  const freqObj = t.freqs?.find(f => f.id === profile?.freq);
  const dayNames = t.dayNames || [];
  const Row = ({ label, value }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 13, color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Nunito', sans-serif", color: T.text }}>{value}</div>
    </div>
  );
  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: "28px 20px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, color: T.text }}>{t.profileTitle}</div>
          <SunOrb size={44} />
        </div>
        <div style={{ background: "linear-gradient(135deg, rgba(122,184,212,0.1), rgba(242,167,75,0.08))", border: `1.5px solid ${T.border}`, borderRadius: 16, padding: "14px 16px", marginBottom: 16, fontFamily: "'Nunito', sans-serif", fontSize: 14, fontStyle: "italic", fontWeight: 600, color: T.primary }}>
          🌿 {t.profileWorking}
        </div>
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>{t.yourFocus}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(profile?.focuses || []).map(fid => {
              const f = t.focusAreas.find(a => a.id === fid);
              if (!f) return null;
              return <div key={fid} style={{ background: "rgba(242,167,75,0.1)", border: `1.5px solid ${T.amber}`, borderRadius: 12, padding: "6px 12px", fontSize: 12, fontWeight: 700, fontFamily: "'Nunito', sans-serif", color: T.text, display: "flex", alignItems: "center", gap: 6 }}>{f.icon} {f.label}</div>;
            })}
          </div>
        </Card>
        <Card style={{ marginBottom: 14 }}>
          <Row label={t.yourFreq} value={freqObj?.label || "—"} />
          <Row label={t.yourDays} value={(profile?.days || []).map(i => dayNames[i]).join(" · ") || "—"} />
          <Row label={t.subscription} value={isTrial ? "Free trial" : "Active"} />
        </Card>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>{t.language}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {LANGUAGES.map(l => (
              <button key={l.id} onClick={() => setLang(l.id)} style={{ background: lang === l.id ? T.primary : "#F0EBE0", color: lang === l.id ? "white" : T.text, borderRadius: 10, padding: "6px 12px", fontSize: 13, fontWeight: 700, fontFamily: "'Nunito', sans-serif", transition: "all 0.2s" }}>
                {l.flag} {l.id.toUpperCase()}
              </button>
            ))}
          </div>
        </Card>
        <PrimaryBtn onClick={onEdit} style={{ background: `linear-gradient(135deg, ${T.primary}, #5aa0bc)`, boxShadow: "0 4px 20px rgba(122,184,212,0.4)", marginBottom: 10 }}>{t.editPrefs}</PrimaryBtn>
        <button onClick={async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!isTrial && session?.access_token) {
            try {
              const res = await fetch('https://clqsqzydhsvgupacqfnj.supabase.co/functions/v1/customer-portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                body: JSON.stringify({ email: session.user.email }),
              });
              const data = await res.json();
              if (data.url) window.location.href = data.url;
              else onManageSubscription();
            } catch(e) { onManageSubscription(); }
          } else { onManageSubscription(); }
        }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px", background: "white", borderRadius: 16, border: `1.5px solid ${T.border}`, fontSize: 14, fontWeight: 600, fontFamily: "'Nunito', sans-serif", color: T.amber, boxShadow: T.shadowSm }}>✨ {t.manageSubscription}</button>
        <button onClick={onSignOut} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "14px", marginTop: 10, background: "none", borderRadius: 16, border: `1.5px solid ${T.border}`, fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", color: T.muted }}>Sign out</button>
      </div>
    </div>
  );
}

// ─── SCREEN: PAYWALL ──────────────────────────────────────────────────────────
async function startCheckout(plan, userEmail, accessToken) {
  try {
    const res = await fetch('https://clqsqzydhsvgupacqfnj.supabase.co/functions/v1/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ plan, email: userEmail }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert('Payment error. Please try again.');
  } catch (e) { alert('Something went wrong. Please try again.'); }
}

function PaywallScreen({ lang, onContinue }) {
  const t = i18n[lang] || i18n.en;
  const [plan, setPlan] = useState("annual");
  const [loading, setLoading] = useState(false);
  const [showPaywallTerms, setShowPaywallTerms] = useState(false);
  const plans = [{ id:"monthly",...t.monthly },{ id:"annual",...t.annual },{ id:"lifetime",...t.lifetime }];
  return (
    <div className="screen" style={{ background: "linear-gradient(180deg, #FFF3D0 0%, #E8F4FD 100%)" }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "32px 20px 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }} className="fade-up">
          <SunOrb size={70} style={{ margin: "0 auto 20px" }} />
          <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: T.primary, background: "rgba(122,184,212,0.15)", borderRadius: 20, padding: "4px 14px", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 14 }}>Free trial active</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 8, lineHeight: 1.25 }}>{t.paywallTitle}</div>
          <div style={{ fontSize: 14, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.55 }}>{t.paywallSub}</div>
        </div>
        <div className="fade-up" style={{ animationDelay: "0.1s", marginBottom: 20 }}>
          {plans.map(p => (
            <button key={p.id} onClick={() => setPlan(p.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: plan === p.id ? "rgba(122,184,212,0.1)" : "white", border: `2px solid ${plan === p.id ? T.primary : T.border}`, borderRadius: 16, padding: "16px", marginBottom: 10, boxShadow: plan === p.id ? T.shadowSm : "none", transition: "all 0.2s" }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 15, fontWeight: 700, color: T.text }}>{p.label}</div>
                <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>{p.period}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {p.badge ? <Pill color={T.amber}>{p.badge}</Pill> : null}
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 18, fontWeight: 800, color: T.text }}>{p.price}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="fade-up" style={{ animationDelay: "0.2s" }}>
          <PrimaryBtn onClick={async () => {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            await startCheckout(plan, session?.user?.email, session?.access_token);
            setLoading(false);
          }}>{loading ? "Loading..." : t.unlockBtn}</PrimaryBtn>
          <div style={{ height: 1, background: T.border, margin: "20px 0" }} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button onClick={() => setShowPaywallTerms(true)} style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans', sans-serif", textDecoration: "underline" }}>{t.terms}</button>
          </div>
          {showPaywallTerms && <TermsModal lang={lang} onClose={() => setShowPaywallTerms(false)} />}
          <button onClick={onContinue} style={{ display: "block", width: "100%", marginTop: 14, fontSize: 13, color: T.muted, fontFamily: "'DM Sans', sans-serif", textAlign: "center" }}>← Back</button>
        </div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem("wami_lang") || detectLang());
  const [screen, setScreen] = useState("loading");
  const [profile, setProfile] = useState(null);
  const [activeNav, setActiveNav] = useState("home");
  const [showWelcome, setShowWelcome] = useState(false);
  const [isTrial, setIsTrial] = useState(true);
  const [user, setUser] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [dailyPrompt, setDailyPrompt] = useState(() => getPrompt(BONUS_PROMPTS, null, [], []));

  useEffect(() => { localStorage.setItem("wami_lang", lang); }, [lang]);

  const loadProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile({ age: data.age_group, kids: data.kids, workTypes: data.work_types || [], focuses: data.focuses || [], freq: data.frequency || 'steady', days: data.active_days || [0,1,2,3,4] });
      if (data.language) setLang(data.language);
      if (data.subscription_status === 'active') setIsTrial(false);
      setDailyPrompt(getPrompt(BONUS_PROMPTS, { age: data.age_group, kids: data.kids, workTypes: data.work_types || [] }, data.focuses || [], []));
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') { setIsTrial(false); setShowWelcome(true); window.history.replaceState({}, '', '/'); }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) { setUser(session.user); await loadProfile(session.user.id); setScreen("main"); }
      else { setScreen("landing"); }
    });
  }, []);

  const t = i18n[lang] || i18n.en;
  const handleStart = () => needsInstall() ? setScreen("install") : setScreen("onboarding");

  if (screen === "loading") {
    return (
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, #FFF3D0 0%, #E8F4FD 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 42, fontWeight: 800, color: T.amber }}>wami</div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: T.bg, fontFamily: "'DM Sans', sans-serif", maxWidth: 420, margin: "0 auto", overflow: "hidden" }}>
      {screen === "landing" && <LandingScreen lang={lang} setLang={setLang} onStart={handleStart} onSignIn={() => setScreen("signin")} onShowTerms={() => setShowTerms(true)} />}
      {screen === "signin" && <SignInScreen lang={lang} onComplete={async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) { setUser(session.user); await loadProfile(session.user.id); }
        setScreen("main");
      }} />}
      {screen === "install" && <InstallScreen onContinue={() => setScreen("onboarding")} />}
      {screen === "onboarding" && (
        <OnboardingScreen lang={lang} setLang={setLang} onComplete={async (data) => {
          setProfile(data);
          if (user) {
            await supabase.from('profiles').upsert({ id: user.id, email: user.email, age_group: data.age, kids: data.kids, work_types: data.workTypes, focuses: data.focuses, frequency: data.freq, active_days: data.days, language: lang, updated_at: new Date().toISOString() });
          }
          setScreen("signup");
        }} />
      )}
      {screen === "signup" && <SignUpScreen lang={lang} onComplete={async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) setUser(session.user);
        setScreen("main"); setShowWelcome(true);
      }} />}
      {screen === "paywall" && <PaywallScreen lang={lang} onContinue={() => { setIsTrial(false); setScreen("main"); setActiveNav("home"); }} />}
      {screen === "main" && (
        <>
          <div className="screen">
            {activeNav === "home" && <HomeScreen key={lang} lang={lang} setLang={setLang} profile={profile} showWelcome={showWelcome} onDismissWelcome={() => setShowWelcome(false)} isTrial={isTrial} onUnlock={() => setScreen("paywall")} dailyPrompt={dailyPrompt} />}
            {activeNav === "explore" && <ExploreScreen lang={lang} profile={profile} />}
            {activeNav === "profile" && (
              <ProfileScreen lang={lang} setLang={setLang} profile={profile} isTrial={isTrial}
                onEdit={() => setScreen("onboarding")}
                onManageSubscription={() => setScreen("paywall")}
                onSignOut={async () => { await supabase.auth.signOut(); setProfile(null); setUser(null); setScreen("landing"); }}
              />
            )}
          </div>
          <BottomNav active={activeNav} onNav={setActiveNav} t={t} />
        </>
      )}
      {showTerms && <TermsModal lang={lang} onClose={() => setShowTerms(false)} />}
    </div>
  );
}
