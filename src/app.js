const { $, $$, h, esc, busy, toast, download, store } = Kit;

const MOTIONS = [
  'This house believes remote work is better than office work.',
  'This house would ban homework in high school.',
  'This house believes social media has done more harm than good.',
  'This house would make voting mandatory.',
  'This house believes AI art is real art.',
  'This house would colonize Mars before fixing Earth.',
  'This house believes college should be free.',
  'This house would replace standardized tests with portfolios.',
  'This house believes video games are a sport.',
  'This house would abolish daylight saving time.',
];
const STYLES = {
  formal: 'Formal parliamentary register. Structured signposting ("First…, Second…").',
  spicy: 'Sharp, witty and a little provocative, but never insulting. Punchy sentences.',
  socratic: 'Lean on pointed questions that expose weaknesses, then answer them.',
  eli12: 'Plain words a 12-year-old understands. Concrete everyday examples.',
};

/* current debate state */
let D = null;
let running = false;
let library = store.get('debate.library', []);

$('#randomMotion').onclick = () => { $('#motion').value = MOTIONS[Math.floor(Math.random() * MOTIONS.length)]; };
$('#mode').onchange = () => $('#humanSideRow').classList.toggle('hidden', $('#mode').value !== 'human');
$('#preVote').oninput = () => { $('#preVoteVal').textContent = $('#preVote').value + '% for'; };
$('#postVote').oninput = () => { $('#postVoteVal').textContent = $('#postVote').value + '% for'; };

const transcriptText = () => D.transcript.map((t) => `[${t.side === 'pro' ? 'PROPOSITION' : 'OPPOSITION'} — ${t.name} — ${t.phase}]\n${t.text}`).join('\n\n');

function turnCard(t) {
  const body = h('div', { class: 'body typing' });
  const card = h('article', { class: 'card turn ' + t.side },
    h('div', { class: 'who' }, h('b', { class: 'side-' + t.side }, (t.side === 'pro' ? '🟦 ' : '🟥 ') + t.name + (t.human ? ' (you)' : '')), h('span', { class: 'tag' }, t.phase)),
    body);
  return { card, body };
}

/* A human turn: show an editor inside the card and wait for submit. */
function humanTurn(card, body, t) {
  body.classList.remove('typing');
  return new Promise((resolve) => {
    const ta = h('textarea', { rows: 5, placeholder: `Your ${t.phase.toLowerCase()} speech (aim for 90-150 words)…` });
    const count = h('span', { class: 'small muted' }, '0 words');
    const timer = h('span', { class: 'tag' }, '2:00');
    let left = 120;
    const iv = setInterval(() => { left--; timer.textContent = `${Math.floor(Math.max(0, left) / 60)}:${String(Math.max(0, left) % 60).padStart(2, '0')}`; if (left === 0) timer.classList.add('bad'); }, 1000);
    ta.oninput = () => { count.textContent = (ta.value.match(/\S+/g) || []).length + ' words'; };
    const go = h('button', { class: 'btn primary sm', onclick: () => {
      const text = ta.value.trim();
      if ((text.match(/\S+/g) || []).length < 15) return toast('Write at least a few sentences', 'err');
      clearInterval(iv);
      body.innerHTML = '';
      body.textContent = text;
      resolve(text);
    } }, 'Deliver speech');
    body.append(ta, h('div', { class: 'row', style: 'margin-top:8px' }, go, count, timer));
    ta.focus();
  });
}

$('#start').onclick = (e) => busy(e.currentTarget, async () => {
  if (running) return;
  const motion = $('#motion').value.trim();
  if (!motion) return toast('Enter a motion first', 'err');
  running = true;
  const human = $('#mode').value === 'human' ? $('#humanSide').value : null;
  D = {
    id: Date.now(), motion, style: $('#style').value, rounds: +$('#rounds').value,
    names: { pro: human === 'pro' ? 'You' : $('#proName').value.trim() || 'Proposition', con: human === 'con' ? 'You' : $('#conName').value.trim() || 'Opposition' },
    human, transcript: [], verdict: null, checks: [], votes: { pre: +$('#preVote').value, post: null },
  };
  $('#transcript').innerHTML = '';
  ['#verdict', '#facts', '#postVoteCard'].forEach((s) => $(s).classList.add('hidden'));
  $('#export').disabled = true;
  try {
    const plan = schedule(D.rounds);
    for (let i = 0; i < plan.length; i++) {
      const [side, phase] = plan[i];
      $('#phase').textContent = `Turn ${i + 1}/${plan.length}`;
      const t = { side, phase, name: D.names[side], text: '', human: side === human };
      const { card, body } = turnCard(t);
      $('#transcript').append(card);
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      if (t.human) t.text = await humanTurn(card, body, t);
      else {
        const sys = `You are ${D.names[side]}, debating on the ${side === 'pro' ? 'PROPOSITION (for)' : 'OPPOSITION (against)'} side of the motion: "${motion}".
Your opponent is ${D.names[side === 'pro' ? 'con' : 'pro']}${human ? ' (a human debater: engage seriously with their actual points)' : ''}.
This is your ${phase} speech. ${phase === 'Opening' ? 'Lay out 2-3 strong arguments.' : phase.startsWith('Rebuttal') ? 'Directly attack the opponent\'s latest points by name, then reinforce your case.' : 'Summarize the key clashes and why your side won them. No new arguments.'}
Style: ${STYLES[D.style]}
Stay in character. 90-150 words. No headings, no stage directions, no markdown.`;
        t.text = await AI.chat(
          [{ role: 'system', content: sys }, { role: 'user', content: D.transcript.length ? 'Debate so far:\n\n' + transcriptText() + '\n\nYour turn.' : 'You speak first. Begin.' }],
          { temperature: 0.85, maxTokens: 400, onToken: (_, acc) => { body.textContent = acc; }, demo: DEMO.turns[{ Opening: { pro: 0, con: 1 }, Closing: { pro: 5, con: 4 } }[phase]?.[side] ?? (side === 'pro' ? 2 : 3)] },
        );
        body.textContent = t.text;
        body.classList.remove('typing');
      }
      D.transcript.push(t);
      renderStats();
    }
    $('#phase').textContent = 'Judging…';
    D.verdict = await AI.chat([
      { role: 'system', content: `You are an impartial championship debate adjudicator. Judge ONLY on what was said. Return JSON:
{"scores":{"pro":{"logic":0-10,"evidence":0-10,"rebuttal":0-10,"delivery":0-10},"con":{...same}},
 "clashes":[{"topic":"short label","pro":"pro's best point on it (1 sentence)","con":"con's best point (1 sentence)","winner":"pro|con"}],
 "winner":"pro|con","margin":"narrow|clear|decisive","reasoning":"3-4 sentences","advice":{"pro":"one tip","con":"one tip"}}
Give 3-4 clashes. Use integers.` },
      { role: 'user', content: `Motion: ${motion}\n\n${transcriptText()}` },
    ], { json: true, temperature: 0.2, demo: DEMO.verdict });
    renderVerdict();
    $('#postVoteCard').classList.remove('hidden');
    $('#phase').textContent = 'Finished';
    $('#export').disabled = false;
    saveToLibrary();
  } finally { running = false; }
});

function renderStats() {
  const agg = { pro: '', con: '' };
  D.transcript.forEach((t) => { agg[t.side] += ' ' + t.text; });
  const a = { pro: analyze(agg.pro, D.names.con), con: analyze(agg.con, D.names.pro) };
  const rows = [['Words spoken', 'words', 0], ['Avg sentence length', 'avgSentence', 1], ['Readability (Flesch)', 'readability', 0], ['Grade level', 'grade', 1], ['Evidence markers', 'evidence', 0], ['Hedge words', 'hedges', 0], ['Questions asked', 'questions', 0], ['Direct call-outs', 'callouts', 0]];
  $('#stats').classList.remove('hidden');
  $('#statsBody').innerHTML = `<table class="mini"><tr><th></th><th class="side-pro">Pro</th><th class="side-con">Con</th></tr>${rows.map(([l, k, d]) => `<tr><td>${l}</td><td>${a.pro[k].toFixed(d)}</td><td>${a.con[k].toFixed(d)}</td></tr>`).join('')}</table>
    <p class="small muted" style="margin-top:8px">Evidence markers = numbers, %, “study/data/research”. Higher Flesch = easier to follow.</p>`;
}

function renderVerdict() {
  const v = D.verdict, names = D.names;
  const w = v.winner === 'con' ? 'con' : 'pro';
  const el = $('#verdict');
  el.classList.remove('hidden');
  el.innerHTML = `
    <h2>Judge's verdict</h2>
    <div class="scoreboard">
      <div>
        <div class="winner side-${w}">🏆 ${esc(names[w])} win${names[w] === 'You' ? '' : 's'}</div>
        <p class="muted">${esc(v.margin || '')} decision · Pro ${totalScore(v.scores, 'pro')}/40 · Con ${totalScore(v.scores, 'con')}/40</p>
        <p>${esc(v.reasoning || '')}</p>
      </div>
      <div>${radarSVG(v.scores || {})}<div class="row small" style="justify-content:center"><span class="side-pro">■ Pro</span><span class="side-con">■ Con</span></div></div>
    </div>
    <h3 style="margin-top:14px">Key clashes</h3>
    ${(v.clashes || []).map((c) => `<div class="small muted" style="font-weight:600;margin-bottom:4px">${esc(c.topic)}</div>
      <div class="clash"><div class="${c.winner === 'pro' ? 'won' : ''}"><b class="side-pro">Pro:</b> ${esc(c.pro)}</div><div class="vs">vs</div><div class="${c.winner === 'con' ? 'won' : ''}"><b class="side-con">Con:</b> ${esc(c.con)}</div></div>`).join('')}
    <div class="grid cols-2" style="margin-top:8px">
      <div class="stat"><div class="k side-pro">Tip for ${esc(names.pro)}</div><div>${esc(v.advice?.pro || '')}</div></div>
      <div class="stat"><div class="k side-con">Tip for ${esc(names.con)}</div><div>${esc(v.advice?.con || '')}</div></div>
    </div>
    ${D.votes.post != null ? audienceHTML() : ''}
    <div class="row" style="margin-top:12px"><button class="btn" id="factBtn">Fact-check the debate</button></div>`;
  $('#factBtn').onclick = (e) => busy(e.currentTarget, factCheck);
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- audience vote (Oxford-style swing) ---------- */
function audienceHTML() {
  const s = voteSwing(D.votes.pre, D.votes.post);
  const bar = (v) => `<div class="vote-bar"><span class="p" style="width:${v}%"></span><span class="c" style="width:${100 - v}%"></span></div>`;
  return `<h3 style="margin-top:14px">Audience (you)</h3>
    <div class="small">Before ${bar(D.votes.pre)} After ${bar(D.votes.post)}</div>
    <p><b>${s.winner === 'tie' ? 'No swing' : `Swing: ${esc(s.label)} → ${esc(D.names[s.winner])} win the room`}</b> <span class="muted small">(Oxford rule: the side that changes the most minds wins.)</span></p>`;
}
$('#castPost').onclick = () => {
  if (!D?.verdict) return;
  D.votes.post = +$('#postVote').value;
  renderVerdict();
  if (D.checks.length) renderFacts();
  saveToLibrary();
};

/* ---------- fact check ---------- */
async function factCheck() {
  const out = await AI.chat([
    { role: 'system', content: 'You are a careful fact-checker. Extract the specific factual claims (statistics, studies, historical facts) from the debate and assess each using well-established knowledge. Be honest about uncertainty. Return JSON {"checks":[{"turn":0,"side":"pro|con","claim":"short quote or paraphrase","verdict":"supported|disputed|unverifiable|false","note":"one sentence"}]}. Max 8 checks.' },
    { role: 'user', content: D.transcript.map((t, i) => `#${i} [${t.side}] ${t.text}`).join('\n\n') },
  ], { json: true, temperature: 0.1, maxTokens: 1500, demo: DEMO.factcheck });
  D.checks = (out.checks || []).filter((c) => c.claim);
  renderFacts();
  saveToLibrary();
}
function renderFacts() {
  const st = factStats(D.checks);
  const el = $('#facts');
  el.classList.remove('hidden');
  const icon = { supported: '✅', disputed: '⚠️', unverifiable: '❔', false: '❌' };
  el.innerHTML = `<h2>Fact check</h2>
    <div class="grid cols-2"><div class="stat"><div class="k side-pro">${esc(D.names.pro)} credibility</div><div class="v">${st.pro.credibility ?? '—'}${st.pro.credibility != null ? '%' : ''}</div></div><div class="stat"><div class="k side-con">${esc(D.names.con)} credibility</div><div class="v">${st.con.credibility ?? '—'}${st.con.credibility != null ? '%' : ''}</div></div></div>
    <div style="margin-top:10px">${D.checks.map((c) => `<div class="fc"><span>${icon[c.verdict] || '•'}</span><div><b class="side-${c.side}">${c.side === 'pro' ? 'Pro' : 'Con'}:</b> ${esc(c.claim)}<div class="small muted">${esc(c.verdict)} · ${esc(c.note)}</div></div></div>`).join('')}</div>
    <p class="small muted">AI fact-checks can be wrong. Treat them as leads, not rulings.</p>`;
}

/* ---------- library ---------- */
function saveToLibrary() {
  library = [D, ...library.filter((x) => x.id !== D.id)].slice(0, 20);
  store.set('debate.library', library);
  renderLibrary();
}
function renderLibrary() {
  const box = $('#library');
  box.innerHTML = '';
  if (!library.length) { box.append(h('div', { class: 'small muted' }, 'Finished debates are saved here.')); return; }
  library.forEach((d) => box.append(h('div', { class: 'lib-item' },
    h('div', { class: 'grow' }, h('div', { class: 'small', style: 'font-weight:600' }, d.motion), h('div', { class: 'small muted' }, `${new Date(d.id).toLocaleDateString()} · ${d.verdict ? `${d.names[d.verdict.winner]} won` : 'unfinished'}${d.human ? ' · you played' : ''}`)),
    h('button', { class: 'btn sm ghost', onclick: () => openDebate(d) }, 'Open'),
    h('button', { class: 'btn sm ghost danger', 'aria-label': 'Delete', onclick: () => { library = library.filter((x) => x !== d); store.set('debate.library', library); renderLibrary(); } }, '✕'))));
}
function openDebate(d) {
  D = d;
  $('#motion').value = d.motion;
  $('#transcript').innerHTML = '';
  d.transcript.forEach((t) => { const { card, body } = turnCard(t); body.classList.remove('typing'); body.textContent = t.text; $('#transcript').append(card); });
  renderStats();
  $('#facts').classList.add('hidden');
  if (d.verdict) { renderVerdict(); $('#postVoteCard').classList.remove('hidden'); }
  if (d.checks?.length) renderFacts();
  $('#export').disabled = !d.verdict;
  $('#phase').textContent = 'From library';
}

$('#export').onclick = () => download('debate.md', debateMarkdown(D), 'text/markdown');
renderLibrary();
