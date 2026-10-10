/* ---------- demo-mode sample output (used only without an API key) ---------- */
var DEMO = {
  turns: [
    "Thank you. First, productivity: a two-year Stanford trial found remote workers were 13% more productive, largely from fewer interruptions and sick days. Second, opportunity: remote work lets a talented engineer in a small town compete for jobs that once required a $3,000-a-month apartment. Third, time: the average commuter loses about 200 hours a year in transit. Give those hours back and you get healthier, better-rested people who do better work. The office was never the work; it was a container for it, and the container is now optional.",
    "My opponent quotes one call-center study and calls it a revolution. But innovation doesn't happen in scheduled calls; it happens in hallways. Research on MIT's famous Building 20 showed that physical proximity drives unexpected collaboration. Second, apprenticeship: junior employees learn by overhearing how seniors handle problems. You can't overhear a muted Zoom tile. Third, culture: trust is built in small moments, the coffee, the lunch, the shared frustration. Remote work optimizes for tasks we already know how to do, and slowly starves the work we haven't imagined yet.",
    "Marcus romanticizes the hallway, but most hallway time is interruption, not inspiration. Studies of open offices found face-to-face interaction actually dropped about 70% after walls came down; people put on headphones and emailed. On apprenticeship, he's right that it matters, which is why good remote teams record decisions, pair-program and write things down. That's better mentorship than hoping a junior overhears the right conversation. And culture built on proximity excludes caregivers and disabled workers. A culture that only works if you're in the room is not a strong culture.",
    "Dr. Ada says remote teams 'write things down.' Some do; most drown in Slack. And notice what she conceded: mentorship matters, and remote work requires extra effort to get it. Now multiply that effort across every new hire at every company. Her open-office statistic is about bad office design, not offices. Nobody here is defending cubicle farms. A well-designed office with quiet zones and collaboration spaces beats a kitchen table. As for inclusion, flexible hybrid policies solve that. They don't require abandoning the office entirely.",
    "Let's be honest about where we landed. My opponent agrees remote work boosts focus. She agrees commutes are wasted time. Her entire case rests on the idea that discipline and documentation can replace human proximity. But companies aren't run by the most disciplined five percent; they're run by real people who learn and bond face-to-face. We won the clash on innovation because creative collisions are hard to schedule. We won on mentorship because she conceded it takes extra effort remotely. Offices adapted. Keep them.",
    "Marcus's closing shows where this debate was won. He now defends a 'well-designed office with quiet zones' and 'flexible hybrid policies,' a position that concedes remote work's core benefits. We won on productivity, where his side offered stories against data. We won on opportunity, where he never answered how a worker in a small town gets in the room. And on mentorship we showed it depends on deliberate practice, which remote-first teams do better. The office isn't evil. It's just no longer necessary, and that's the motion. Please propose.",
  ],
  verdict: {
    scores: { pro: { logic: 8, evidence: 9, rebuttal: 8, delivery: 7 }, con: { logic: 7, evidence: 6, rebuttal: 8, delivery: 8 } },
    clashes: [
      { topic: 'Productivity', pro: 'Cited a two-year trial showing a 13% productivity gain for remote workers.', con: 'Argued the study was narrow (call-center work).', winner: 'pro' },
      { topic: 'Innovation & serendipity', pro: 'Open-office data shows proximity does not guarantee interaction.', con: 'Unplanned collisions spark ideas that schedules cannot.', winner: 'con' },
      { topic: 'Mentorship', pro: 'Documentation and pairing make mentorship deliberate.', con: 'Juniors learn by osmosis; remote requires extra effort.', winner: 'con' },
      { topic: 'Access & inclusion', pro: 'Remote widens opportunity to small towns, caregivers and disabled workers.', con: 'Hybrid flexibility can deliver inclusion without abandoning offices.', winner: 'pro' },
    ],
    winner: 'pro',
    margin: 'narrow',
    reasoning: 'Both sides were strong on rebuttal. The proposition carried it on evidence: they anchored productivity and access in data, while the opposition relied more on intuition and anecdotes. The opposition clearly won the mentorship clash but drifted toward defending hybrid work in the closing, which weakened their opposition to the motion as worded.',
    advice: { pro: 'Address the innovation argument with your own evidence instead of only attacking theirs.', con: 'Hold your ground; defending hybrid in the closing quietly conceded the motion.' },
  },
};

DEMO.factcheck = { checks: [
  { turn: 0, side: 'pro', claim: 'A two-year Stanford trial found remote workers were 13% more productive', verdict: 'supported', note: 'Bloom et al. (2015) found ~13% gains among call-center staff at Ctrip, a narrower setting than implied.' },
  { turn: 0, side: 'pro', claim: 'The average commuter loses about 200 hours a year', verdict: 'supported', note: 'Consistent with US Census average one-way commutes of ~27 minutes.' },
  { turn: 1, side: 'con', claim: "MIT's Building 20 showed proximity drives collaboration", verdict: 'supported', note: 'Widely cited, though the evidence is largely historical and anecdotal.' },
  { turn: 2, side: 'pro', claim: 'Face-to-face interaction dropped about 70% in open offices', verdict: 'supported', note: 'Bernstein & Turban (2018) reported roughly 70% fewer face-to-face interactions.' },
  { turn: 3, side: 'con', claim: 'Most remote teams drown in Slack', verdict: 'unverifiable', note: 'Rhetorical generalization with no cited data.' },
  { turn: 4, side: 'con', claim: 'Companies are run by people who bond face-to-face, not the disciplined five percent', verdict: 'unverifiable', note: 'Opinion presented as fact.' },
] };
