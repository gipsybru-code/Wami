export const TRIAL_PROMPTS = {
  stress: [
    "Sit somewhere with natural light for two minutes.",
    "Relax your jaw while reading this.",
    "Let 'good enough' exist once today.",
    "Notice one thing that is already handled.",
    "Make one corner of your space calmer.",
    "Before the next thing, exhale fully once.",
  ],
  energy: [
    "Open a window before reaching for more stimulation.",
    "Stretch like you have just woken up.",
    "Eat something with colour today.",
    "Stand in daylight for one minute.",
    "Roll your shoulders slowly ten times.",
    "Check whether you need water before caffeine.",
  ],
  focus: [
    "Let silence exist for two minutes.",
    "Choose progress over perfect preparation.",
    "Read one paragraph more slowly than usual.",
    "Finish one tiny thing completely.",
    "Remove one unnecessary decision from today.",
    "Keep one promise to yourself before helping everyone else.",
  ],
  creativity: [
    "Rearrange three objects differently.",
    "Describe today using only textures.",
    "Listen to a sound you normally tune out.",
    "Draw a shape without planning it first.",
    "Save one strange idea instead of dismissing it.",
    "Notice a colour combination you like today.",
    "Use your non-dominant hand for one small thing.",
    "Imagine your current mood as weather.",
    "Observe how people move rather than what they say.",
  ],
  eating: [
    "Put one colourful ingredient on your plate.",
    "Sit down fully while eating one meal.",
    "Taste the first bite before multitasking.",
    "Prepare something simple with care.",
    "Let one meal happen without a screen nearby.",
    "Hunger and stress can sound similar inside the body.",
  ],
  movement: [
    "Stretch the part of your body that feels most ignored.",
    "Walk during one phone call today.",
    "Change levels: sit, stand, reach, bend.",
    "Let movement wake you up gently.",
    "Notice how your mood shifts after moving.",
    "Stretch like you have just woken up.",
  ],
  digital: [
    "Listen to one full song without checking anything else.",
    "Let one conversation happen without glancing away.",
    "Choose one offline activity that still feels comforting.",
    "Rest your attention before asking more from it.",
    "Your mind also needs uncluttered space.",
    "A softer evening can begin with one less screen.",
  ],
  sleep: [
    "Avoid solving life while lying in bed.",
    "Lower stimulation before lowering your body into rest.",
    "Breathe out longer than you breathe in once tonight.",
    "Give yourself permission to rest before being fully exhausted.",
    "Choose one calming sound for the evening.",
    "Let darkness arrive a little earlier.",
    "Rest is still valuable even when sleep is imperfect.",
  ],
  confidence: [
    "Speak to yourself in a tone you would trust from someone else.",
    "Remember one thing you handle better now than before.",
    "Take up your full space while sitting or standing.",
    "Confidence can be quiet.",
    "Wear something that feels like yourself today.",
    "Pause before apologizing automatically.",
    "Let one opinion exist without overexplaining it.",
  ],
  relationships: [
    "Listen long enough for someone to finish fully.",
    "Send one message with no goal except warmth.",
    "Ask one more curious question than usual.",
    "Put your attention where your body is.",
    "Appreciation can be small and still matter.",
    "Pause before assuming tone through text.",
    "Let one interaction be slower today.",
  ],
  joy: [
    "Laugh fully if something is genuinely funny.",
    "Let pleasure exist without productivity attached to it.",
    "Open the window and notice the air for a moment.",
    "Wear or use something that lifts your mood slightly.",
    "Save one good moment instead of rushing past it.",
    "Listen to music that changes your breathing.",
  ],
  calm: [
    "Reflect on something that mattered this week.",
    "You are allowed to evolve gradually.",
    "Release one version of yourself you no longer need to protect.",
    "Pay attention to what consistently gives you energy.",
    "Small repeated actions quietly shape identity.",
  ],
};

export function getTrialPrompts(focuses) {
  const pool = [];
  const activeFocuses = focuses?.length > 0 ? focuses : Object.keys(TRIAL_PROMPTS);
  activeFocuses.forEach(f => {
    if (TRIAL_PROMPTS[f]) {
      TRIAL_PROMPTS[f].forEach((text, i) => {
        pool.push({ id: `trial_${f}_${i}`, text, focus: f });
      });
    }
  });
  return pool;
}
