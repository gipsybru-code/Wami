import { useState, useEffect, useCallback } from "react";
import { supabase } from './lib/supabase.js';

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

const TRIAL_PROMPTS = {
  stress: ["Sit somewhere with natural light for two minutes.","Relax your jaw while reading this.","Let 'good enough' exist once today.","Notice one thing that is already handled.","Make one corner of your space calmer.","Before the next thing, exhale fully once."],
  energy: ["Open a window before reaching for more stimulation.","Stretch like you have just woken up.","Eat something with colour today.","Stand in daylight for one minute.","Roll your shoulders slowly ten times.","Check whether you need water before caffeine."],
  focus: ["Let silence exist for two minutes.","Choose progress over perfect preparation.","Read one paragraph more slowly than usual.","Finish one tiny thing completely.","Remove one unnecessary decision from today.","Keep one promise to yourself before helping everyone else."],
  creativity: ["Rearrange three objects differently.","Describe today using only textures.","Listen to a sound you normally tune out.","Draw a shape without planning it first.","Save one strange idea instead of dismissing it.","Notice a colour combination you like today.","Use your non-dominant hand for one small thing.","Imagine your current mood as weather.","Observe how people move rather than what they say."],
  eating: ["Put one colourful ingredient on your plate.","Sit down fully while eating one meal.","Taste the first bite before multitasking.","Prepare something simple with care.","Let one meal happen without a screen nearby.","Hunger and stress can sound similar inside the body."],
  movement: ["Stretch the part of your body that feels most ignored.","Walk during one phone call today.","Change levels: sit, stand, reach, bend.","Let movement wake you up gently.","Notice how your mood shifts after moving.","Stretch like you have just woken up."],
  digital: ["Listen to one full song without checking anything else.","Let one conversation happen without glancing away.","Choose one offline activity that still feels comforting.","Rest your attention before asking more from it.","Your mind also needs uncluttered space.","A softer evening can begin with one less screen."],
  sleep: ["Avoid solving life while lying in bed.","Lower stimulation before lowering your body into rest.","Breathe out longer than you breathe in once tonight.","Give yourself permission to rest before being fully exhausted.","Choose one calming sound for the evening.","Let darkness arrive a little earlier.","Rest is still valuable even when sleep is imperfect."],
  confidence: ["Speak to yourself in a tone you would trust from someone else.","Remember one thing you handle better now than before.","Take up your full space while sitting or standing.","Confidence can be quiet.","Wear something that feels like yourself today.","Pause before apologizing automatically.","Let one opinion exist without overexplaining it."],
  relationships: ["Listen long enough for someone to finish fully.","Send one message with no goal except warmth.","Ask one more curious question than usual.","Put your attention where your body is.","Appreciation can be small and still matter.","Pause before assuming tone through text.","Let one interaction be slower today."],
  joy: ["Laugh fully if something is genuinely funny.","Let pleasure exist without productivity attached to it.","Open the window and notice the air for a moment.","Wear or use something that lifts your mood slightly.","Save one good moment instead of rushing past it.","Listen to music that changes your breathing."],
  calm: ["Reflect on something that mattered this week.","You are allowed to evolve gradually.","Release one version of yourself you no longer need to protect.","Pay attention to what consistently gives you energy.","Small repeated actions quietly shape identity."],
};

function getTrialPrompts(focuses) {
  const pool = [];
  const activeFocuses = focuses?.length > 0 ? focuses : Object.keys(TRIAL_PROMPTS);
  activeFocuses.forEach(f => {
    if (TRIAL_PROMPTS[f]) TRIAL_PROMPTS[f].forEach((text, i) => pool.push({ id: `trial_${f}_${i}`, text, focus: f }));
  });
  return pool;
}

const MAIN_PROMPTS = {
  stress: ["Sit somewhere with natural light for two minutes.","Relax your jaw while reading this.","Let 'good enough' exist once today.","Notice one thing that is already handled.","Make one corner of your space calmer.","Before the next thing, exhale fully once.","Breathing out slowly for 6 seconds might calm your nervous system a little.","Three slow breaths right now — in through the nose, out through the mouth — could shift something.","Dropping your shoulders away from your ears might help more than you'd expect.","Unclenching your jaw and your hands at the same time could feel like a small release.","Close your eyes for 10 seconds. Just that.","Roll your shoulders back slowly, three times.","Stand up, walk to a different room, and come back. That's it.","Get up and go to the window. Look outside for a moment.","Notice if you're making an effort with your face. Let it go.","Whatever is feeling urgent right now — it might be important, but it probably isn't an emergency.","One thing at a time. Just the next one thing.","You don't have to solve everything today. Just today.","Good enough is sometimes exactly enough.","Notice five things you can see right now. Just look at them.","What does the air feel like on your skin right now? Just notice.","Find one sound around you and follow it for 30 seconds.","Let go of any thinking for a moment. Your mind will wander. Let it pass.","Notice a calm sound nearby. If there isn't one, find it in your mind — waves, wind, rain.","Find the feeling of sun warming your face. Let it spread.","Remember the voice of someone you love. Let it play in your mind for a moment.","Think of a song you love. How does it start? Let it run.","You don't have to be calm. You just have to get through the next hour.","Think of one thing you did well today — anything at all. Let yourself notice it.","Writing down one worry tonight and closing the notebook could help your mind let go.","The day is done. You made it through. That's enough.","Allowing tomorrow to be tomorrow might be the kindest thing you do for yourself tonight.","If there is a solution, why stress? And if there is no solution — why stress?","How important will any of this be in 10 years? Let that question breathe for a moment.","Sometimes slower is faster.","Walk slower. Eat slower. Speak slower. The process is the point.","Notice where your body is storing worry right now. Breathe slowly toward that place. Let it go.","What do I need more of right now: rest, silence, movement, or connection?","Can you breathe without trying to fix everything? Just for this one breath.","Repeat slowly: I choose peace. I release what I cannot control. One breath at a time. I am here now."],
  energy: ["Open a window before reaching for more stimulation.","Stretch like you have just woken up.","Eat something with colour today.","Stand in daylight for one minute.","Roll your shoulders slowly ten times.","Check whether you need water before caffeine.","A few deep breaths right now could shift your energy more than you'd expect.","Splash cold water on your face. 5 seconds. Notice the difference.","Stand up and stretch your arms above your head for 10 seconds.","Walk to a different room and back. Just to move.","Step outside for 2 minutes, even briefly. Natural light resets your energy.","Eat something small if you haven't in a few hours. Your body might just be waiting.","Put on one song that tends to lift you. Let it play fully.","Take a deep breath in, then open your mouth wide, stick your tongue all the way out and exhale with a 'haaaa.'","Find a spot where you can do 10 small jumps. Just 10.","Remember something funny that happened with a friend. Let yourself smile at it.","Think of a moment when you felt truly alive and well. Let your body remember that feeling.","Low energy is often your body asking for something simple — water, food, movement, or rest.","A slow hour doesn't mean a slow day.","Close your eyes for 60 seconds. Not to sleep — just to rest them completely.","Breathe in and imagine bringing energy in with the air. Breathe out and let the tiredness go.","Low energy in the evening is your body doing its job. Let it.","What would genuinely restore you tonight? Try to give yourself at least some of it.","Put on something comfortable the moment you get home. Let your body start unwinding early.","Try a foot bath — warm water, a few minutes, nothing else.","In winter especially, it's worth checking your vitamin D levels.","Sleep isn't just rest. It directly shapes your patience, your mood and your resilience tomorrow."],
  focus: ["Let silence exist for two minutes.","Choose progress over perfect preparation.","Read one paragraph more slowly than usual.","Finish one tiny thing completely.","Remove one unnecessary decision from today.","Keep one promise to yourself before helping everyone else.","Write the next sentence. Just that one.","Set a timer for 25 minutes. Focus until it rings — then give yourself a real break.","Close every tab except one.","Write the three things you need to do today. Circle the one that matters most.","Put your phone face down and out of reach.","Clear the surface in front of you. Then start.","Write down what's blocking you. Look at it. Now pick the smallest piece you can move.","Open the document. Just open it.","Pick the easiest thing on your list and finish it completely.","Turn off notifications for the next 30 minutes.","Say out loud what you're about to do. Hearing it makes it real.","Your mind will wander. That's fine. Just notice it and bring it back.","Break your task into 3 parts. Break the first part into 2. Do the very first thing needed.","Get a paper and pen. Write down anything that distracts you as it comes. Handle it after.","Not everything on your list deserves equal energy. What actually matters today?","Finishing something small completely is worth more than starting five things.","Imperfect and done beats perfect and waiting.","Write down exactly where you left off today so tomorrow you can begin without searching.","Your unfinished tasks will wait. You've done enough today.","Name your one most important task for tomorrow. Write it down. Close the notebook."],
  movement: ["Stretch the part of your body that feels most ignored.","Walk during one phone call today.","Change levels: sit, stand, reach, bend.","Let movement wake you up gently.","Notice how your mood shifts after moving.","Stretch like you have just woken up.","Find a reason to get up — water, a window, a stretch. Any reason works.","10 jumping jacks. Go.","Roll your shoulders back 5 times. Then forward 5 times.","Do 10 slow squats. Hold the last one for 5 seconds.","Skip instead of walk to wherever you're going next.","Dance for one song. Alone is fine. Actually especially alone.","Shake your whole body loose for 15 seconds.","Hip rolls. Slow circles, both directions. 10 each way.","Swim standing. Freestyle arms for 20 seconds, then breaststroke.","Standing, soften your knees and shake them gently.","Find a tennis ball and roll each foot slowly over it.","Cat and cow. On all fours, arch your back up slowly, then let it drop. Follow your breath.","Legs wide. Right hand reaches to left toe, come up with hands on hips. Left hand to right toe.","Gently nod yes, then shake no, then drop one ear to your shoulder. Finish with slow head rolls.","A slow walk after dinner — even just around the block — could change how you sleep.","Gentle stretching for 5 minutes before bed.","Lie on the floor with your legs up against the wall for 2 minutes."],
  eating: ["Put one colourful ingredient on your plate.","Sit down fully while eating one meal.","Taste the first bite before multitasking.","Prepare something simple with care.","Let one meal happen without a screen nearby.","Hunger and stress can sound similar inside the body.","Drink a full glass of water before your next meal.","Have you eaten in the last 4 hours? Your body might be waiting.","Eat your next meal sitting down, without a screen. Just the food.","Notice what you're craving right now. Is it food — or something else?","Chew slower than usual for just one meal today.","What if today were a no-sugar day? Just today.","Remember extra virgin olive oil today — instead of any other oil or butter.","Did you remember your vegetables today?","Try not to eat while nervous, angry, or distracted. Land first. Then start.","When you feel almost full, stop. Leave a small corner of appetite.","Boiled rice, avocado and a boiled egg. Simple, nourishing, surprisingly good.","Thirsty? A large glass of fresh cold water might be exactly what you need.","Tonight, close the kitchen after dinner.","Before bed, a small chamomile or linden tea.","The soup of the poor: onion, garlic, potato, sweet potato, zucchini, water, olive oil, paprika. Blend it.","Eat like a king at breakfast, a prince at lunch, and a pauper at dinner. Just for today."],
  relationships: ["Listen long enough for someone to finish fully.","Send one message with no goal except warmth.","Ask one more curious question than usual.","Put your attention where your body is.","Appreciation can be small and still matter.","Pause before assuming tone through text.","Let one interaction be slower today.","Text someone you haven't spoken to in a while. Just two words is enough — 'thinking of you.'","Put your phone away the next time someone is talking to you. Just listen.","Tell someone one specific thing you appreciate about them today.","Ask someone how they really are — and wait for the real answer.","Do something small for someone today without being asked.","Remember something funny that happened with a friend. Tell them.","Next time you disagree with someone, try starting with 'yes, and...' instead of 'yes, but...'","Before reacting, take one breath. Just one.","Use someone's name when you speak to them today.","Speak more slowly than usual in your next conversation.","Try saying less than you planned today. Leave space.","Before you send that message, wait 5 minutes. Then read it again as if you're receiving it.","Feel the urge to raise your voice? Try lowering it instead.","Before speaking, ask yourself: is it true? Is it necessary? Is it kind?","Zoom out. Is this worth your peace? Visualise your peace. Then decide.","Get down to eye level with your child for a few minutes.","Before bed, think of one person you're grateful to have in your life."],
  sleep: ["Avoid solving life while lying in bed.","Lower stimulation before lowering your body into rest.","Breathe out longer than you breathe in once tonight.","Give yourself permission to rest before being fully exhausted.","Choose one calming sound for the evening.","Let darkness arrive a little earlier.","Rest is still valuable even when sleep is imperfect.","Dim the lights now. Your brain takes its cues from the light around you.","Put your phone in another room tonight. Just try it once.","Write down the three things you need to do tomorrow. Close the notebook. Done.","Have a warm shower or bath before bed tonight.","Stop eating at least two hours before bed if you can.","No screens for 30 minutes before bed tonight.","Tidy one small thing before bed. A clear space makes a quieter mind.","Lie down and feel the weight of your body against the mattress. Let yourself be held.","Lay on your back and tense your feet for 5 seconds, then release. Work slowly up your whole body.","Close your eyes. You're under warm blankets. Outside, rain falls softly. You have nowhere to be.","Imagine a place where you have always felt completely safe. Put yourself there now.","Write down any worries before you close your eyes. Get it out of your head and onto paper.","Sleep is a medicine. Free, natural, and more powerful than most things you could take.","The night brings wisdom. If something feels unsolvable, sleep on it.","Go to sleep early tonight. Nine hours will make you a completely different person tomorrow.","Try to avoid coffee after 1pm. Caffeine stays in your system longer than you think.","Have you tried magnesium supplements? Many people are deficient and it can make a real difference.","Tonight, let your phone sleep in another room. See how tomorrow morning feels."],
  calm: ["Notice your breath right now without changing it.","Feel your feet on the floor. Let that bring you back.","Look for something beautiful in the room you're in.","What emotion is most present in you right now? Name it.","Notice if you are resisting anything right now. Just observe.","Notice if your mind is in the past or the future. Gently bring it back. Here. Now.","Ask yourself: what do I need more of — rest, silence, movement, or connection?","What would this moment feel like if you had nothing to worry about?","Stop. Wait. Think calmly. Where are you heading right now — and why?","What day is today? What time is it right now? What matters most in this moment?","Close your eyes and observe your breath. Notice how air enters your nostrils and fills your belly.","Repeat slowly: I choose peace. I release what I cannot control. One breath at a time.","Let your shoulders drop. Let your breath slow. Let this moment be enough.","The quieter you become, the more you can hear.","Find something in the room that is perfectly still. Watch it for 30 seconds.","Wash your hands slowly today. Feel the water temperature, the soap, the texture.","Walk barefoot for a few minutes. Feel the ground change beneath you.","Do one ordinary thing very slowly today.","What blessings have you been overlooking lately? Name even one.","What simple moment touched your heart today — however small?","What moments make you feel deeply alive?","Let stillness teach you something today. Sit with it.","This moment will not come again. It just needs to be lived.","Repeat slowly: I am enough. I have enough. I do enough.","What is the kindest thing you could do for yourself in the next 10 minutes?"],
  digital: ["Listen to one full song without checking anything else.","Let one conversation happen without glancing away.","Choose one offline activity that still feels comforting.","Rest your attention before asking more from it.","Your mind also needs uncluttered space.","A softer evening can begin with one less screen.","Notice how many times you've checked your phone in the last hour. Just notice.","Before you open any app, ask yourself: what am I actually looking for right now?","Leave your phone in another room for the next hour.","Turn off all notifications for the next 2 hours.","Is there something you're avoiding by scrolling right now?","Put your phone away during your next meal. Completely away.","Have you considered blue-light blocking glasses?","Check your environment: screen at eye level? Chair supporting your back?","Try voice notes today instead of typing. Your hands and eyes will get a real rest.","Feel the urge to google something? Write it down instead. If it still matters tomorrow, look it up.","Try a no-phone policy after 8pm on weekends.","Create a no-phone zone — the dining table, the bathroom, nature walks.","Don't let your phone steal moments with the people you love. Put it down. Be there.","What do you gain when you don't scroll? What things in real life deserve your attention?","Life happens outside of the phone. Step into it.","Take a 10-minute break from your screen and go hug a tree.","What would you do with an extra hour if screens didn't exist? Start with 15 minutes of that.","Notice how you feel after 20 minutes of scrolling. Then after 20 minutes outside.","Your attention is one of the most valuable things you own. What is it going toward right now?"],
  joy: ["Laugh fully if something is genuinely funny.","Let pleasure exist without productivity attached to it.","Open the window and notice the air for a moment.","Wear or use something that lifts your mood slightly.","Save one good moment instead of rushing past it.","Listen to music that changes your breathing.","Reflect on something that mattered this week.","You are allowed to evolve gradually.","Release one version of yourself you no longer need to protect.","Pay attention to what consistently gives you energy.","What reliably gives you 5% more aliveness? Notice what those things are.","Buy some colourful flowers and put them somewhere you'll see them often.","Try a 15-second hug today — with someone close. Count slowly. Feel the difference.","Physical activity increases dopamine. Try a 15-minute walk, noticing the colours of everything you pass.","Make an appointment with yourself this week. One hour, non-negotiable, just for you.","Is there a hobby you've always wanted to try? What's stopping you?","Find a sunset today and watch it. The whole thing.","You are here today. You are alive. That alone is already extraordinary luck.","Yesterday is done. Tomorrow isn't here. Today will never come again.","Joy also comes from stopping — unapologetically — the things that don't bring you anything good.","Pink, yellow, red — why not? Wear a colour that makes you feel something.","Everyone brings joy — some people when they arrive, and some when they leave.","Natural light is one of the simplest mood-lifters. Sit somewhere with sunlight on your face."],
  confidence: ["Speak to yourself in a tone you would trust from someone else.","Remember one thing you handle better now than before.","Take up your full space while sitting or standing.","Confidence can be quiet.","Wear something that feels like yourself today.","Pause before apologizing automatically.","Let one opinion exist without overexplaining it.","Look at how many things you do well — at home, at work, in small ways every day.","When self-doubt appears, name it quietly. Feel your feet on the floor. Return to what you were doing.","Confidence usually follows action — not the other way around. Do it at 60% confidence.","Lift your chin gently. Relax your forehead, your jaw. Take a long slow exhale.","Someone else being brilliant does not make you less capable.","You cannot judge a fish by its ability to climb a tree.","Compare yourself only to who you were before.","Frantic energy reduces effectiveness. Real confidence is usually quieter.","Not everyone must approve of you. Accepting that creates enormous freedom.","When uncertainty strikes: what are three other possible interpretations?","How you are perceived today really won't matter in 10 years.","Socially confident people are often simply less afraid of awkward moments.","Slowing down communicates safety to your nervous system.","When in doubt: what would a self-respecting person do here? Not a perfect one.","Stop fearing mistakes, emotions, imperfection, awkwardness. From there, life opens up.","Instead of 'I'm nervous' — try 'my body is preparing for performance.'","Inhale slowly for 4 seconds. Exhale for 6 to 8. Long exhales calm your nervous system.","Enjoy the process. Plans change, people change their minds, mistakes happen. All of that is okay."],
  creativity: ["Rearrange three objects differently.","Describe today using only textures.","Listen to a sound you normally tune out.","Draw a shape without planning it first.","Save one strange idea instead of dismissing it.","Notice a colour combination you like today.","Use your non-dominant hand for one small thing.","Imagine your current mood as weather.","Observe how people move rather than what they say.","The brain creates by recombining what it knows. Feed it varied material today.","Try combining two unrelated fields — jazz and architecture, biology and design.","Start a collection of anything that catches your eye.","Stop forcing ideas. Relax instead. Many insights arrive indirectly.","Keep an idea capture system — voice notes, a sketchbook, a phone note.","Creativity needs boredom. Protect some unstimulated time today.","Give yourself permission to make bad work. The willingness to create badly is essential.","Try a timed creative sprint — 20 minutes, one clear prompt, no editing allowed.","Try the 10 bad ideas method. Generate 10 mediocre ideas. Often idea 7 or 8 becomes interesting.","Take an unusual position and look at your surroundings differently.","Look at something from another perspective — the chair from a child's eye level.","Overcome the fear of the blank page. Pick a random word, shape, colour — and transform it.","A small finished work teaches more than a giant unfinished ambition.","Creativity is what happens when perception becomes alive enough to connect things others overlook.","Try the 'yes, and' principle. Instead of rejecting an idea, extend it first.","Separate generation from judgment. Generate wildly first. Edit strategically after."],
};

const BONUS_PROMPTS = {
  small_kids: { stress:["Lower your shoulders before answering the next tiny emergency."], energy:["Drink a glass of water while the children are distracted for one minute."], confidence:["Keeping small humans alive is already a lot."], focus:["Choose one thing to finish. The rest can wait 10 minutes."], relationships:["Give one fully present minute instead of multitasking."], sleep:["Tonight, lower one expectation before bedtime."], creativity:["Notice one funny thing your child said today."], digital:["Try one child-related moment without reaching for your phone."] },
  teens: { relationships:["Ask one curious question without trying to fix anything."], stress:["Not every silence means disconnection."], confidence:["Teenagers push boundaries more than they reveal affection."], focus:["Pause before reacting immediately."], energy:["Protect 10 minutes today that belong only to you."], digital:["Let one conversation happen without competing with screens."], calm:["Breathe before entering a difficult conversation."] },
  office: { focus:["Close one unnecessary tab."], energy:["Stand up before answering the next message."], stress:["Unclench your jaw while reading emails."], movement:["Roll your shoulders slowly before your next task."], digital:["Take your lunch break away from your main screen."], sleep:["Create a small end-of-work ritual before evening begins."], creativity:["Solve one problem on paper instead of on-screen."] },
  physical_work: { energy:["Pause for water before pushing through tiredness."], stress:["Physical exhaustion can feel emotional too."], movement:["Stretch the part of your body that worked hardest today."], sleep:["Let recovery count as productivity tonight."], confidence:["Your body does difficult work every day."], focus:["Slow one repetitive movement slightly."], calm:["Check whether you need rest, food or quiet before judging your mood."] },
  young: { confidence:["You do not need your whole future figured out today."], creativity:["Save one idea without judging whether it's useful."], relationships:["Send one message that feels genuine instead of strategic."], focus:["Pick one meaningful task before opening social media."], stress:["Confusion can be part of growth."], digital:["Leave one moment today undocumented."], joy:["Notice what gives you energy instead of only what looks impressive."] },
  senior: { movement:["Take a gentle stretch break before sitting again."], relationships:["Reach out to someone whose voice you enjoy hearing."], calm:["Pause to notice one comforting detail around you."], confidence:["Your experience already carries wisdom."], joy:["Recall one moment that still makes you smile."], creativity:["Tell or write a small story from your past."], stress:["Let today move at a human pace."] },
};

function getPrompt(profile, focuses, shownIds = []) {
  const pool = [];
  const tags = [];
  if (profile?.kids === 1) tags.push("small_kids");
  if (profile?.kids === 2) tags.push("teens");
  if (profile?.workTypes?.includes(0)) tags.push("office");
  if (profile?.workTypes?.includes(1)) tags.push("physical_work");
  if (profile?.age === 0) tags.push("young");
  if (profile?.age === 2) tags.push("senior");
  const activeFocuses = focuses?.length > 0 ? focuses : Object.keys(MAIN_PROMPTS);
  activeFocuses.forEach(f => {
    if (MAIN_PROMPTS[f]) MAIN_PROMPTS[f].forEach((p, i) => pool.push({ id: `main_${f}_${i}`, text: p, weight: 1 }));
    tags.forEach(tag => { if (BONUS_PROMPTS[tag]?.[f]) BONUS_PROMPTS[tag][f].forEach((p, i) => pool.push({ id: `bonus_${tag}_${f}_${i}`, text: p, weight: 3 })); });
  });
  const fresh = pool.filter(p => !shownIds.includes(p.id));
  const source = fresh.length > 0 ? fresh : pool;
  const totalWeight = source.reduce((s, p) => s + p.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const p of source) { rand -= p.weight; if (rand <= 0) return p; }
  return source[source.length - 1];
}

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
    paywallTitle: "Unlock the full experience.", paywallSub: "686 prompts across 12 focus areas. New every day.",
    unlockBtn: "Unlock all prompts", restore: "Restore purchase", terms: "Terms · Privacy",
    homeGreeting: "Good morning 🌅", todayPrompt: "Today's nudge", nextPrompt: "Next prompt",
    tunein: "Before your next prompt — take one breath and notice how you feel right now.",
    explore: "Explore", profile: "Profile", home: "Home",
    exploreTitle: "12 Focus Areas", exploreSub: "Tap any area to learn more.",
    profileTitle: "Your Wami", profileWorking: "Wami is quietly working for you.",
    editPrefs: "Edit preferences", yourFocus: "Your focus areas", yourFreq: "Frequency",
    yourDays: "Active days", language: "Language", subscription: "Subscription",
    manageSubscription: "Manage subscription",
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

  it: {
    tagline: "Cresci con gentilezza.", sub: "Piccoli spunti per un cambiamento significativo e il benessere.",
    hero1: "Non hai bisogno di motivazione.", hero2: "Hai bisogno di un'interruzione.",
    goodAfternoon: "Buon pomeriggio 🌤️", goodEvening: "Buonasera 🌙",
    desc: "Wami invia suggerimenti gentili e specifici durante la tua giornata — per aiutarti a muoverti, respirare, concentrarti, connetterti e crescere.",
    focus12: "12 aree di focus", focusDesc: "Stress · Energia · Focus · Movimento · Alimentazione · Relazioni · Sonno · Calma · Digitale · Gioia · Fiducia · Creatività",
    frequency: "3 livelli di frequenza", freqDesc: "Leggero (2×/settimana) · Regolare (1×/giorno) · Presente (3×/giorno)",
    trial: "Inizia gratis — 14 giorni", signin: "Hai già un account? Accedi",
    onboardTitle: "Personalizzalo", onboardSub: "Alcune scelte rapide per rendere i tuoi suggerimenti personali.",
    ageLabel: "Come ti vedi?", kidsLabel: "Bambini", workTypeLabel: "Tipo di lavoro",
    focusLabel: "Di cosa vorresti di più?", focusSub: "Scegli fino a 5 aree di focus.",
    freqLabel: "Con quale frequenza vorresti un suggerimento?", daysLabel: "Quali giorni?", letsgo: "Iniziamo →",
    signupTitle: "Il tuo profilo è pronto.", signupSub: "Crea il tuo account per salvarlo e iniziare.",
    emailPlaceholder: "La tua email", passwordPlaceholder: "Scegli una password", createAccount: "Crea account",
    paywallTitle: "Sblocca l'esperienza completa.", paywallSub: "686 suggerimenti in 12 aree di focus. Nuovi ogni giorno.",
    unlockBtn: "Sblocca tutti i suggerimenti", restore: "Ripristina acquisto", terms: "Termini · Privacy",
    homeGreeting: "Buongiorno 🌅", todayPrompt: "Il tuo suggerimento", nextPrompt: "Prossimo suggerimento",
    tunein: "Prima del prossimo suggerimento — fai un respiro e nota come ti senti.",
    explore: "Esplora", profile: "Profilo", home: "Home",
    exploreTitle: "12 Aree di Focus", exploreSub: "Tocca un'area per saperne di più.",
    profileTitle: "Il tuo Wami", profileWorking: "Wami sta lavorando per te in silenzio.",
    editPrefs: "Modifica preferenze", yourFocus: "Le tue aree di focus", yourFreq: "Frequenza",
    yourDays: "Giorni attivi", language: "Lingua", subscription: "Abbonamento",
    manageSubscription: "Gestisci abbonamento",
    ages: ["Giovane", "Adulto", "Senior"],
    kids: ["Nessun figlio", "Bambini piccoli", "Adolescenti", "Figli grandi"],
    workTypes: ["Ufficio", "Fisicamente impegnativo", "Altro"],
    freqs: [
      { id: "light",   label: "Leggero",  desc: "2 suggerimenti a settimana", interval: 240 },
      { id: "steady",  label: "Regolare", desc: "1 suggerimento al giorno",   interval: 120 },
      { id: "present", label: "Presente", desc: "3 suggerimenti al giorno",   interval: 60  },
    ],
    dayNames: ["L","M","M","G","V","S","D"],
    focusAreas: [
      { id:"stress",        icon:"🌬️", label:"Meno stress",           desc:"Respira, rilasciati, trova equilibrio" },
      { id:"energy",        icon:"⚡",  label:"Più energia",           desc:"Svegliati dall'interno" },
      { id:"focus",         icon:"🎯",  label:"Migliore focus",        desc:"Trova il tuo filo e seguilo" },
      { id:"movement",      icon:"🏃",  label:"Muoviti di più",        desc:"Piccoli inviti a muoversi" },
      { id:"eating",        icon:"🥑",  label:"Mangia meglio",         desc:"Un rapporto più gentile con il cibo" },
      { id:"relationships", icon:"🤝",  label:"Relazioni migliori",    desc:"Piccoli gesti che avvicinano" },
      { id:"sleep",         icon:"🌙",  label:"Dormi meglio",          desc:"Riposo più profondo e ristoratore" },
      { id:"calm",          icon:"🌊",  label:"Calma e presenza",      desc:"Rallenta, nota, arriva" },
      { id:"digital",       icon:"📵",  label:"Equilibrio digitale",   desc:"Riprendi la tua attenzione" },
      { id:"joy",           icon:"✨",  label:"Gioia e spirito",       desc:"Meraviglia, bellezza, significato" },
      { id:"confidence",    icon:"🦋",  label:"Più fiducia in te",     desc:"Fidati di te stesso un po' di più" },
      { id:"creativity",    icon:"🎨",  label:"Più creatività",        desc:"Crea, immagina, esprimi" },
    ],
    monthly:  { label: "Mensile",  period: "/mese",          price: "€3,99", badge: "" },
    annual:   { label: "Annuale",  period: "/anno",          price: "€19",   badge: "Miglior offerta" },
    lifetime: { label: "A vita",   period: "pagamento unico", price: "€59",  badge: "Per sempre" },
  },

  es: {
    tagline: "Crece con amabilidad.", sub: "Pequeños recordatorios para un cambio significativo y bienestar.",
    hero1: "No necesitas motivación.", hero2: "Necesitas una interrupción.",
    goodAfternoon: "Buenas tardes 🌤️", goodEvening: "Buenas noches 🌙",
    desc: "Wami envía recordatorios gentiles y específicos a lo largo del día — ayudándote a moverte, respirar, concentrarte, conectar y crecer.",
    focus12: "12 áreas de enfoque", focusDesc: "Estrés · Energía · Enfoque · Movimiento · Alimentación · Relaciones · Sueño · Calma · Digital · Alegría · Confianza · Creatividad",
    frequency: "3 niveles de frecuencia", freqDesc: "Suave (2×/semana) · Regular (1×/día) · Presente (3×/día)",
    trial: "Empieza gratis — 14 días", signin: "¿Ya tienes cuenta? Inicia sesión",
    onboardTitle: "Hazlo tuyo", onboardSub: "Unas pocas elecciones para que tus recordatorios sean personales.",
    ageLabel: "¿Cómo te ves?", kidsLabel: "Hijos", workTypeLabel: "Tipo de trabajo",
    focusLabel: "¿Qué te gustaría tener más?", focusSub: "Elige hasta 5 áreas de enfoque.",
    freqLabel: "¿Con qué frecuencia quieres un recordatorio?", daysLabel: "¿Qué días?", letsgo: "¡Vamos! →",
    signupTitle: "Tu perfil está listo.", signupSub: "Crea tu cuenta para guardarlo y empezar.",
    emailPlaceholder: "Tu email", passwordPlaceholder: "Elige una contraseña", createAccount: "Crear cuenta",
    paywallTitle: "Desbloquea la experiencia completa.", paywallSub: "686 recordatorios en 12 áreas de enfoque. Nuevos cada día.",
    unlockBtn: "Desbloquear todos", restore: "Restaurar compra", terms: "Términos · Privacidad",
    homeGreeting: "Buenos días 🌅", todayPrompt: "Tu recordatorio", nextPrompt: "Próximo recordatorio",
    tunein: "Antes del próximo recordatorio — respira hondo y nota cómo te sientes.",
    explore: "Explorar", profile: "Perfil", home: "Inicio",
    exploreTitle: "12 Áreas de Enfoque", exploreSub: "Toca cualquier área para saber más.",
    profileTitle: "Tu Wami", profileWorking: "Wami está trabajando silenciosamente para ti.",
    editPrefs: "Editar preferencias", yourFocus: "Tus áreas de enfoque", yourFreq: "Frecuencia",
    yourDays: "Días activos", language: "Idioma", subscription: "Suscripción",
    manageSubscription: "Gestionar suscripción",
    ages: ["Joven", "Adulto", "Senior"],
    kids: ["Sin hijos", "Hijos pequeños", "Adolescentes", "Hijos adultos"],
    workTypes: ["Oficina", "Físicamente exigente", "Otro"],
    freqs: [
      { id: "light",   label: "Suave",    desc: "2 recordatorios por semana", interval: 240 },
      { id: "steady",  label: "Regular",  desc: "1 recordatorio por día",     interval: 120 },
      { id: "present", label: "Presente", desc: "3 recordatorios por día",    interval: 60  },
    ],
    dayNames: ["L","M","X","J","V","S","D"],
    focusAreas: [
      { id:"stress",        icon:"🌬️", label:"Menos estrés",          desc:"Respira, suelta, encuentra equilibrio" },
      { id:"energy",        icon:"⚡",  label:"Más energía",           desc:"Despierta desde adentro" },
      { id:"focus",         icon:"🎯",  label:"Mejor enfoque",         desc:"Encuentra tu hilo y síguelo" },
      { id:"movement",      icon:"🏃",  label:"Muévete más",           desc:"Pequeñas invitaciones a moverse" },
      { id:"eating",        icon:"🥑",  label:"Comer mejor",           desc:"Una relación más gentil con la comida" },
      { id:"relationships", icon:"🤝",  label:"Mejores relaciones",    desc:"Pequeños gestos que acercan" },
      { id:"sleep",         icon:"🌙",  label:"Dormir mejor",          desc:"Descanso más profundo" },
      { id:"calm",          icon:"🌊",  label:"Calma y presencia",     desc:"Desacelera, nota, llega" },
      { id:"digital",       icon:"📵",  label:"Equilibrio digital",    desc:"Recupera tu atención" },
      { id:"joy",           icon:"✨",  label:"Alegría y espíritu",    desc:"Asombro, belleza, significado" },
      { id:"confidence",    icon:"🦋",  label:"Más confianza",         desc:"Confía en ti mismo un poco más" },
      { id:"creativity",    icon:"🎨",  label:"Más creatividad",       desc:"Crea, imagina, expresa" },
    ],
    monthly:  { label: "Mensual",     period: "/mes",       price: "€3,99", badge: "" },
    annual:   { label: "Anual",       period: "/año",       price: "€19",   badge: "Mejor oferta" },
    lifetime: { label: "De por vida", period: "pago único", price: "€59",   badge: "Para siempre" },
  },

  pt: {
    tagline: "Cresça com gentileza.", sub: "Pequenos lembretes para mudanças significativas e bem-estar.",
    hero1: "Você não precisa de motivação.", hero2: "Você precisa de uma interrupção.",
    goodAfternoon: "Boa tarde 🌤️", goodEvening: "Boa noite 🌙",
    desc: "Wami envia lembretes gentis e específicos ao longo do dia — ajudando você a se mover, respirar, focar, conectar e crescer.",
    focus12: "12 áreas de foco", focusDesc: "Estresse · Energia · Foco · Movimento · Alimentação · Relacionamentos · Sono · Calma · Digital · Alegria · Confiança · Criatividade",
    frequency: "3 níveis de frequência", freqDesc: "Leve (2×/semana) · Regular (1×/dia) · Presente (3×/dia)",
    trial: "Comece grátis — 14 dias", signin: "Já tem conta? Entre",
    onboardTitle: "Personalize", onboardSub: "Algumas escolhas rápidas para tornar seus lembretes pessoais.",
    ageLabel: "Como você se vê?", kidsLabel: "Filhos", workTypeLabel: "Tipo de trabalho",
    focusLabel: "O que você gostaria de ter mais?", focusSub: "Escolha até 5 áreas de foco.",
    freqLabel: "Com que frequência quer um lembrete?", daysLabel: "Quais dias?", letsgo: "Vamos lá →",
    signupTitle: "Seu perfil está pronto.", signupSub: "Crie sua conta para salvar e começar.",
    emailPlaceholder: "Seu email", passwordPlaceholder: "Escolha uma senha", createAccount: "Criar conta",
    paywallTitle: "Desbloqueie a experiência completa.", paywallSub: "686 lembretes em 12 áreas de foco. Novos todo dia.",
    unlockBtn: "Desbloquear todos", restore: "Restaurar compra", terms: "Termos · Privacidade",
    homeGreeting: "Bom dia 🌅", todayPrompt: "Seu lembrete", nextPrompt: "Próximo lembrete",
    tunein: "Antes do próximo lembrete — respire fundo e note como você se sente.",
    explore: "Explorar", profile: "Perfil", home: "Início",
    exploreTitle: "12 Áreas de Foco", exploreSub: "Toque em qualquer área para saber mais.",
    profileTitle: "Seu Wami", profileWorking: "Wami está trabalhando silenciosamente para você.",
    editPrefs: "Editar preferências", yourFocus: "Suas áreas de foco", yourFreq: "Frequência",
    yourDays: "Dias ativos", language: "Idioma", subscription: "Assinatura",
    manageSubscription: "Gerenciar assinatura",
    ages: ["Jovem", "Adulto", "Senior"],
    kids: ["Sem filhos", "Filhos pequenos", "Adolescentes", "Filhos adultos"],
    workTypes: ["Escritório", "Fisicamente exigente", "Outro"],
    freqs: [
      { id: "light",   label: "Leve",     desc: "2 lembretes por semana",  interval: 240 },
      { id: "steady",  label: "Regular",  desc: "1 lembrete por dia",      interval: 120 },
      { id: "present", label: "Presente", desc: "3 lembretes por dia",     interval: 60  },
    ],
    dayNames: ["S","T","Q","Q","S","S","D"],
    focusAreas: [
      { id:"stress",        icon:"🌬️", label:"Menos estresse",        desc:"Respire, solte, encontre equilíbrio" },
      { id:"energy",        icon:"⚡",  label:"Mais energia",          desc:"Desperte por dentro" },
      { id:"focus",         icon:"🎯",  label:"Melhor foco",           desc:"Encontre seu fio e siga" },
      { id:"movement",      icon:"🏃",  label:"Mova-se mais",          desc:"Pequenos convites para se mover" },
      { id:"eating",        icon:"🥑",  label:"Comer melhor",          desc:"Uma relação mais gentil com a comida" },
      { id:"relationships", icon:"🤝",  label:"Melhores relacionamentos", desc:"Pequenos gestos que aproximam" },
      { id:"sleep",         icon:"🌙",  label:"Dormir melhor",         desc:"Descanso mais profundo" },
      { id:"calm",          icon:"🌊",  label:"Calma e presença",      desc:"Desacelere, perceba, chegue" },
      { id:"digital",       icon:"📵",  label:"Equilíbrio digital",    desc:"Recupere sua atenção" },
      { id:"joy",           icon:"✨",  label:"Alegria e espírito",    desc:"Maravilha, beleza, significado" },
      { id:"confidence",    icon:"🦋",  label:"Mais confiança",        desc:"Confie em si mesmo um pouco mais" },
      { id:"creativity",    icon:"🎨",  label:"Mais criatividade",     desc:"Crie, imagine, expresse" },
    ],
    monthly:  { label: "Mensal",    period: "/mês",   price: "R$21,90", badge: "" },
    annual:   { label: "Anual",     period: "/ano",   price: "R$104",   badge: "Melhor oferta" },
    lifetime: { label: "Vitalício", period: "único",  price: "R$319",   badge: "Para sempre" },
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
    paywallTitle: "Débloquez l'expérience complète.", paywallSub: "686 suggestions dans 12 domaines. Nouvelles chaque jour.",
    unlockBtn: "Débloquer toutes les suggestions", restore: "Restaurer l'achat", terms: "Conditions · Confidentialité",
    homeGreeting: "Bonjour 🌅", todayPrompt: "Votre suggestion", nextPrompt: "Prochaine suggestion",
    tunein: "Avant votre prochaine suggestion — respirez profondément et remarquez comment vous vous sentez.",
    explore: "Explorer", profile: "Profil", home: "Accueil",
    exploreTitle: "12 Domaines de Focus", exploreSub: "Appuyez sur un domaine pour en savoir plus.",
    profileTitle: "Votre Wami", profileWorking: "Wami travaille silencieusement pour vous.",
    editPrefs: "Modifier les préférences", yourFocus: "Vos domaines de focus", yourFreq: "Fréquence",
    yourDays: "Jours actifs", language: "Langue", subscription: "Abonnement",
    manageSubscription: "Gérer l'abonnement",
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

// ─── SCREEN: LANDING ──────────────────────────────────────────────────────────
function LandingScreen({ lang, setLang, onStart, onSignIn }) {
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
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, fontStyle: "italic", fontWeight: 600, color: T.text, lineHeight: 1.55, marginTop: 12 }}>
             "Before your next thing, pause for a glass of water. A soft reset.\nAvant la prochaine chose, faites une pause pour un verre d'eau. Une douce remise à zéro."
tvb
            </div>
          </div>
        </div>
        <div className="fade-up" style={{ animationDelay: "0.2s" }}>
          <PrimaryBtn onClick={onStart}>{t.trial}</PrimaryBtn>
          <button onClick={onSignIn} style={{ color: T.muted, fontSize: 13, fontWeight: 400, fontFamily: "'DM Sans', sans-serif", width: "100%", padding: "10px", marginTop: 8 }}>{t.signin}</button>
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>{t.terms}</div>
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
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 8, lineHeight: 1.3 }}>
            Install Wami for the best experience
          </div>
          <div style={{ fontSize: 14, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
            Installing takes 30 seconds and enables nudge notifications throughout your day.
          </div>
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
        <button onClick={onContinue} style={{ display: "block", width: "100%", marginTop: 12, fontSize: 13, color: T.muted, fontFamily: "'DM Sans', sans-serif", textAlign: "center", padding: "8px" }}>
          Skip for now (notifications may not work)
        </button>
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
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {t.ages.map((a, i) => <SelectPill key={i} label={a} selected={age === i} onClick={() => setAge(i)} />)}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>{t.kidsLabel}</div>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {t.kids.map((k, i) => <SelectPill key={i} label={k} selected={kids === i} onClick={() => setKids(i)} />)}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 10 }}>{t.workTypeLabel}</div>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {t.workTypes.map((w, i) => <SelectPill key={i} label={w} selected={workTypes.includes(i)} onClick={() => toggleWorkType(i)} />)}
              </div>
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

// ─── SCREEN: SIGN UP ──────────────────────────────────────────────────────────
function SignInScreen({ lang, onComplete }) {
  const t = i18n[lang] || i18n.en;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.includes("@")) { setError("Please enter a valid email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError("");
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      onComplete();
    } catch (e) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="screen" style={{ background: "linear-gradient(180deg, #FFF3D0 0%, #E8F4FD 100%)" }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "32px 20px 48px" }}>
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 36 }}>
          <WamiHero />
          <SunOrb size={60} style={{ margin: "24px auto 24px" }} />
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 700, color: "#4A4A4A", marginBottom: 8 }}>Welcome back.</div>
          <div style={{ fontSize: 14, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>Sign in to continue your journey.</div>
        </div>
        <div className="fade-up" style={{ animationDelay: "0.1s" }}>
          <input type="email" placeholder={t.emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)} style={{ display: "block", width: "100%", background: "white", border: `1.5px solid ${T.border}`, borderRadius: 14, padding: "14px 16px", fontSize: 14, color: T.text, marginBottom: 12, boxShadow: T.shadowSm }} />
          <input type="password" placeholder={t.passwordPlaceholder} value={password} onChange={e => setPassword(e.target.value)} style={{ display: "block", width: "100%", background: "white", border: `1.5px solid ${T.border}`, borderRadius: 14, padding: "14px 16px", fontSize: 14, color: T.text, marginBottom: 12, boxShadow: T.shadowSm }} />
          {error && <div style={{ fontSize: 12, color: T.coral, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>{error}</div>}
          <PrimaryBtn onClick={handleSignIn} disabled={loading}>{loading ? "Signing in..." : "Sign in"}</PrimaryBtn>
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>{t.terms}</div>
        </div>
      </div>
    </div>
  );
}

function SignUpScreen({ lang, onComplete }) {
  const t = i18n[lang] || i18n.en;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!email.includes("@")) { setError("Please enter a valid email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError("");
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
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
          <PrimaryBtn onClick={handleCreate}>{t.createAccount}</PrimaryBtn>
          <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
            One account per email. 14-day free trial included. {t.terms}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: HOME ─────────────────────────────────────────────────────────────
function HomeScreen({ lang, setLang, profile, showWelcome, onDismissWelcome, onUnlock, isTrial }) {
  const t = i18n[lang] || i18n.en;
  const trialPool = useState(() => getTrialPrompts(profile?.focuses))[0];
  const [shownIds, setShownIds] = useState([]);
  const [currentPrompt] = useState(() => !isTrial ? getPrompt(profile, profile?.focuses, []) : null);
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

  const promptText = isTrial ? trialPool[0]?.text : currentPrompt?.text;

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
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 4 }}>Welcome to Wami.</div>
            <div style={{ fontSize: 13, color: T.muted, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
              {isTrial ? `Your free trial has started. You have ${trialPool.length} curated prompts to explore.` : "Your full prompt library is unlocked. Grow kindly. 🌿"}
            </div>
          </div>
        )}

        {notifStatus === "default" && (
          <button onClick={requestNotifications} className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "linear-gradient(135deg, rgba(184,169,201,0.15), rgba(122,184,212,0.1))", border: `1.5px solid rgba(184,169,201,0.4)`, borderRadius: 20, padding: "14px 18px", marginBottom: 12, textAlign: "left" }}>
            <div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>🔔 Enable nudge notifications</div>
              <div style={{ fontSize: 11, color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>Receive prompts through your day</div>
            </div>
            <div style={{ background: T.primary, color: "white", borderRadius: 10, padding: "6px 12px", fontSize: 11, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>Allow</div>
          </button>
        )}
        {notifStatus === "granted" && (
          <div className="fade-up" style={{ background: "rgba(122,184,212,0.1)", border: `1.5px solid rgba(122,184,212,0.3)`, borderRadius: 16, padding: "12px 16px", marginBottom: 12, fontSize: 12, color: T.primary, fontFamily: "'DM Sans', sans-serif" }}>
            ✓ Notifications enabled — nudges are on their way
          </div>
        )}

        <Card style={{ marginBottom: 16, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: "radial-gradient(circle, rgba(242,167,75,0.1), transparent)", borderRadius: "0 24px 0 80px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <Pill color={isTrial ? T.primary : T.amber}>
              {isTrial ? `Free trial` : t.todayPrompt}
            </Pill>
          </div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 17, fontStyle: "italic", fontWeight: 600, color: T.text, lineHeight: 1.55, marginBottom: 20, minHeight: 80 }}>
            "{promptText}"
          </div>
          <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>
              {isTrial ? `Free trial prompt` : `${t.nextPrompt}: later today`}
            </div>
          </div>
        </Card>

        {isTrial && (
          <button onClick={onUnlock} className="fade-up" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "linear-gradient(135deg, rgba(242,167,75,0.12), rgba(122,184,212,0.1))", border: `1.5px solid ${T.amber}`, borderRadius: 20, padding: "16px 20px", marginBottom: 16, textAlign: "left" }}>
            <div>
              <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 3 }}>✨ Unlock 686 prompts</div>
              <div style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>Across 12 focus areas. Personal to you. New every day.</div>
            </div>
            <div style={{ background: `linear-gradient(135deg, ${T.amber}, ${T.coral})`, color: "white", borderRadius: 12, padding: "8px 14px", fontSize: 12, fontWeight: 700, fontFamily: "'Nunito', sans-serif", boxShadow: "0 2px 12px rgba(242,167,75,0.3)", whiteSpace: "nowrap" }}>See plans →</div>
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
        <button onClick={onManageSubscription} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "14px", background: "white", borderRadius: 16, border: `1.5px solid ${T.border}`, fontSize: 14, fontWeight: 600, fontFamily: "'Nunito', sans-serif", color: T.amber, boxShadow: T.shadowSm }}>✨ {t.manageSubscription}</button>
        <button onClick={onSignOut} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", padding: "14px", marginTop: 10, background: "none", borderRadius: 16, border: `1.5px solid ${T.border}`, fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", color: T.muted }}>Sign out</button>
      </div>
    </div>
  );
}

// ─── SCREEN: PAYWALL ──────────────────────────────────────────────────────────
async function startCheckout(plan, userEmail) {
  try {
    const res = await fetch(
      'https://clqsqzydhsvgupacqfnj.supabase.co/functions/v1/create-checkout',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, email: userEmail }),
      }
    )
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else alert('Payment error. Please try again.')
  } catch (e) {
    alert('Something went wrong. Please try again.')
  }
}

function PaywallScreen({ lang, onContinue }) {
  const t = i18n[lang] || i18n.en;
  const [plan, setPlan] = useState("annual");
  const [loading, setLoading] = useState(false);
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
            await startCheckout(plan, session?.user?.email);
            setLoading(false);
          }}>
            {loading ? "Loading..." : t.unlockBtn}
          </PrimaryBtn>
          <div style={{ height: 1, background: T.border, margin: "20px 0" }} />
          <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
            <button style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>{t.restore}</button>
            <button style={{ fontSize: 12, color: T.muted, fontFamily: "'DM Sans', sans-serif" }}>{t.terms}</button>
          </div>
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

  useEffect(() => { localStorage.setItem("wami_lang", lang); }, [lang]);

  // Load profile from Supabase for a logged-in user
  const loadProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile({
        age: data.age_group,
        kids: data.kids,
        workTypes: data.work_types || [],
        focuses: data.focuses || [],
        freq: data.frequency || 'steady',
        days: data.active_days || [0,1,2,3,4],
      });
      if (data.language) setLang(data.language);
      if (data.subscription_status === 'active') setIsTrial(false);
    }
  };

  // On app load — check for existing session or payment return
  useEffect(() => {
    // Handle Stripe payment return
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setIsTrial(false);
      setShowWelcome(true);
      window.history.replaceState({}, '', '/');
    }

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
        setScreen("main");
      } else {
        setScreen("landing");
      }
    });
  }, []);

  const t = i18n[lang] || i18n.en;
  const handleStart = () => needsInstall() ? setScreen("install") : setScreen("onboarding");

  // Show blank screen while checking session
  if (screen === "loading") {
    return (
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, #FFF3D0 0%, #E8F4FD 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 42, fontWeight: 800, color: T.amber }}>wami</div>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: T.bg, fontFamily: "'DM Sans', sans-serif", maxWidth: 420, margin: "0 auto", overflow: "hidden" }}>

      {/* Landing — shown to logged-out users */}
      {screen === "landing" && (
        <LandingScreen
          lang={lang} setLang={setLang}
          onStart={handleStart}
          onSignIn={() => setScreen("signin")}
        />
      )}

      {/* Sign in — email + password */}
      {screen === "signin" && (
        <SignInScreen lang={lang} onComplete={async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
            await loadProfile(session.user.id);
          }
          setScreen("main");
        }} />
      )}

      {/* Install guide — mobile only */}
      {screen === "install" && <InstallScreen onContinue={() => setScreen("onboarding")} />}

      {/* Onboarding — new users only */}
      {screen === "onboarding" && (
        <OnboardingScreen lang={lang} setLang={setLang} onComplete={async (data) => {
          setProfile(data);
          if (user) {
            await supabase.from('profiles').upsert({
              id: user.id, email: user.email,
              age_group: data.age, kids: data.kids,
              work_types: data.workTypes, focuses: data.focuses,
              frequency: data.freq, active_days: data.days,
              language: lang, updated_at: new Date().toISOString()
            });
          }
          setScreen("signup");
        }} />
      )}

      {/* Sign up — new users create account */}
      {screen === "signup" && (
        <SignUpScreen lang={lang} onComplete={async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) setUser(session.user);
          setScreen("main");
          setShowWelcome(true);
        }} />
      )}

      {/* Paywall */}
      {screen === "paywall" && (
        <PaywallScreen lang={lang} onContinue={() => { setIsTrial(false); setScreen("main"); setActiveNav("home"); }} />
      )}

      {/* Main app */}
      {screen === "main" && (
        <>
          <div className="screen">
            {activeNav === "home" && (
              <HomeScreen
                lang={lang} setLang={setLang} profile={profile}
                showWelcome={showWelcome} onDismissWelcome={() => setShowWelcome(false)}
                isTrial={isTrial} onUnlock={() => setScreen("paywall")}
              />
            )}
            {activeNav === "explore" && <ExploreScreen lang={lang} profile={profile} />}
            {activeNav === "profile" && (
              <ProfileScreen
                lang={lang} setLang={setLang} profile={profile} isTrial={isTrial}
                onEdit={() => setScreen("onboarding")}
                onManageSubscription={() => setScreen("paywall")}
                onSignOut={async () => {
                  await supabase.auth.signOut();
                  setProfile(null);
                  setUser(null);
                  setScreen("landing");
                }}
              />
            )}
          </div>
          <BottomNav active={activeNav} onNav={setActiveNav} t={t} />
        </>
      )}

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} lang={lang} />}
    </div>
  );
}
