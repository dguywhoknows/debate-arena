test('schedule: openings, rebuttals, closings in order', () => {
  const s = schedule(2);
  assert.eq(s.length, 8);
  assert.deepEq(s[0], ['pro', 'Opening']);
  assert.deepEq(s[1], ['con', 'Opening']);
  assert.deepEq(s[4], ['pro', 'Rebuttal 2']);
  assert.deepEq(s[6], ['con', 'Closing'], 'opposition closes first');
  assert.deepEq(s[7], ['pro', 'Closing']);
});

test('schedule: zero rounds still has openings and closings', () => {
  assert.eq(schedule(0).length, 4);
});

test('syllables: common words', () => {
  assert.eq(syllables('cat'), 1);
  assert.eq(syllables('table'), 2);
  assert.eq(syllables('happy'), 2);
  assert.eq(syllables('communication'), 5);
  assert.eq(syllables(''), 0);
});

test('analyze: counts evidence markers, hedges and questions', () => {
  const a = analyze('A 2019 study found 40% gains. Perhaps that is wrong? Data matters.', 'Marcus');
  assert.ok(a.evidence >= 4, 'evidence ' + a.evidence);
  assert.eq(a.hedges, 1);
  assert.eq(a.questions, 1);
  assert.eq(a.words, 10);
});

test('analyze: counts call-outs of the opponent by first name', () => {
  const a = analyze('Marcus is wrong. My opponent ignores data. Marcus again.', 'Marcus — startup CEO');
  assert.eq(a.callouts, 3);
});

test('analyze: readability is clamped to 0..100 and empty text is safe', () => {
  const a = analyze('', 'X');
  assert.eq(a.words, 0);
  assert.eq(a.readability, 0);
  const b = analyze('Go. Go. Go. Go.', 'X');
  assert.ok(b.readability <= 100 && b.readability >= 0);
});

test('radarPoint: top axis points straight up, full value reaches the radius', () => {
  const [x, y] = radarPoint(0, 4, 10, 100, 80);
  assert.near(x, 100, 1e-9);
  assert.near(y, 20, 1e-9);
  const [x2] = radarPoint(1, 4, 10, 100, 80);
  assert.near(x2, 180, 1e-9);
});

test('radarSVG: produces two filled polygons for the two sides', () => {
  const svg = radarSVG({ pro: { logic: 5, evidence: 5, rebuttal: 5, delivery: 5 }, con: {} });
  assert.eq((svg.match(/fill-opacity/g) || []).length, 2);
  assert.ok(svg.startsWith('<svg'));
});

test('totalScore sums the rubric and ignores junk', () => {
  assert.eq(totalScore({ pro: { logic: 8, evidence: 9, rebuttal: 7, delivery: '6' } }, 'pro'), 30);
  assert.eq(totalScore({}, 'con'), 0);
});

test('voteSwing: Oxford rule rewards movement, not the majority', () => {
  assert.eq(voteSwing(70, 65).winner, 'con', 'motion still has majority but lost support');
  assert.eq(voteSwing(30, 41.5).delta, 11.5);
  assert.eq(voteSwing(50, 50).winner, 'tie');
});

test('factStats: credibility weights verdicts and ignores unknown sides', () => {
  const s = factStats([
    { side: 'pro', verdict: 'supported' }, { side: 'pro', verdict: 'false' },
    { side: 'con', verdict: 'unverifiable' }, { side: 'con', verdict: 'supported' },
    { side: 'judge', verdict: 'supported' }, { side: 'pro', verdict: 'weird' },
  ]);
  assert.eq(s.pro.credibility, 50);
  assert.eq(s.con.credibility, 75);
  assert.eq(factStats([]).pro.credibility, null);
});

test('debateMarkdown includes transcript, verdict, audience and fact check', () => {
  const md = debateMarkdown({
    motion: 'Cats > dogs', names: { pro: 'A', con: 'B' },
    transcript: [{ side: 'pro', name: 'A', phase: 'Opening', text: 'Meow.', human: true }],
    verdict: { winner: 'pro', margin: 'clear', reasoning: 'R', scores: { pro: { logic: 1 } }, clashes: [] },
    votes: { pre: 40, post: 55 },
    checks: [{ side: 'pro', verdict: 'supported', claim: 'Cats purr', note: 'true' }],
  });
  assert.ok(md.includes('# Debate: Cats > dogs'));
  assert.ok(md.includes('[human]'));
  assert.ok(md.includes('+15 pts toward the motion'));
  assert.ok(md.includes('[supported]'));
});
