/* Pure, DOM-free logic for Debate Arena (unit-tested in tests/). */

var RUBRIC = ['logic', 'evidence', 'rebuttal', 'delivery'];

/* Speaking order: openings, N rebuttal rounds, then closings (opposition closes first). */
function schedule(rounds) {
  var s = [['pro', 'Opening'], ['con', 'Opening']];
  for (var i = 1; i <= rounds; i++) s.push(['pro', 'Rebuttal ' + i], ['con', 'Rebuttal ' + i]);
  s.push(['con', 'Closing'], ['pro', 'Closing']);
  return s;
}

/* Heuristic English syllable counter used by readability formulas. */
function syllables(w) {
  w = String(w).toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  var m = w.match(/[aeiouy]{1,2}/g);
  return Math.max(1, m ? m.length : 1);
}

/* Rhetoric metrics for one side's combined speeches. */
function analyze(text, oppName) {
  text = String(text || '');
  var words = text.match(/[A-Za-z']+/g) || [];
  var sentences = text.split(/[.!?]+/).filter(function (s) { return s.trim().length > 2; });
  var syl = words.reduce(function (a, w) { return a + syllables(w); }, 0);
  var wps = words.length / Math.max(1, sentences.length);
  var flesch = words.length ? 206.835 - 1.015 * wps - 84.6 * (syl / words.length) : 0;
  var grade = words.length ? 0.39 * wps + 11.8 * (syl / words.length) - 15.59 : 0;
  var count = function (re) { return (text.match(re) || []).length; };
  var first = (String(oppName || '').split(/[\s—-]+/)[0] || '').replace(/[^A-Za-z]/g, '');
  return {
    words: words.length,
    avgSentence: wps,
    readability: Math.max(0, Math.min(100, flesch)),
    grade: Math.max(0, grade),
    evidence: count(/\b\d[\d,.]*%?|\bstud(y|ies)\b|\bdata\b|\bresearch\b|\bsurvey\b|\breport\b|\bper ?cent\b/gi),
    hedges: count(/\b(might|perhaps|possibly|arguably|maybe|could|somewhat|likely)\b/gi),
    questions: count(/\?/g),
    callouts: count(/\b(my opponent|opposition|proposition|you claim|you said)\b/gi) + (first.length > 1 ? count(new RegExp('\\b' + first + '\\b', 'g')) : 0),
  };
}

/* Radar chart geometry: point on axis i of n at value v (0-10). */
function radarPoint(i, n, v, cx, r) {
  var ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
  return [cx + Math.cos(ang) * r * (v / 10), cx + Math.sin(ang) * r * (v / 10)];
}
function radarSVG(scores, rubric) {
  rubric = rubric || RUBRIC;
  var size = 220, c = size / 2, r = 80, n = rubric.length;
  var pt = function (i, v) { return radarPoint(i, n, v, c, r); };
  var ring = function (v) { return rubric.map(function (_, i) { return pt(i, v).join(','); }).join(' '); };
  var poly = function (side, color) {
    return '<polygon points="' + rubric.map(function (k, i) { return pt(i, +((scores[side] || {})[k]) || 0).join(','); }).join(' ') + '" fill="' + color + '" fill-opacity=".22" stroke="' + color + '" stroke-width="2"/>';
  };
  var labels = rubric.map(function (k, i) { var p = pt(i, 12.3); return '<text x="' + p[0] + '" y="' + p[1] + '" text-anchor="middle" dominant-baseline="middle" font-size="11" fill="var(--muted)">' + k + '</text>'; }).join('');
  return '<svg viewBox="0 0 ' + size + ' ' + size + '" width="100%" style="max-width:220px" role="img" aria-label="Score radar chart">' +
    [2.5, 5, 7.5, 10].map(function (v) { return '<polygon points="' + ring(v) + '" fill="none" stroke="var(--line)"/>'; }).join('') +
    rubric.map(function (_, i) { var p = pt(i, 10); return '<line x1="' + c + '" y1="' + c + '" x2="' + p[0] + '" y2="' + p[1] + '" stroke="var(--line)"/>'; }).join('') +
    poly('pro', 'var(--pro)') + poly('con', 'var(--con)') + labels + '</svg>';
}

function totalScore(scores, side) {
  return RUBRIC.reduce(function (a, k) { return a + (+((scores && scores[side]) || {})[k] || 0); }, 0);
}

/* Oxford-style audience vote: the side that GAINS the most support wins, not the side with more votes.
   pre/post are percentages "for the motion" (0-100); undecided is the remainder handled by the caller. */
function voteSwing(pre, post) {
  var d = Math.round((post - pre) * 10) / 10;
  return { delta: d, winner: d > 0 ? 'pro' : d < 0 ? 'con' : 'tie', label: d === 0 ? 'No movement' : (d > 0 ? '+' : '') + d + ' pts toward ' + (d > 0 ? 'the motion' : 'opposition') };
}

/* Fact-check aggregation: credibility = supported / (checked claims), unverifiable counted as half. */
var FACT_W = { supported: 1, unverifiable: 0.5, disputed: 0.25, false: 0 };
function factStats(checks) {
  var by = { pro: { n: 0, score: 0 }, con: { n: 0, score: 0 } };
  (checks || []).forEach(function (c) {
    var s = by[c.side];
    if (!s || !(c.verdict in FACT_W)) return;
    s.n++; s.score += FACT_W[c.verdict];
  });
  ['pro', 'con'].forEach(function (k) { by[k].credibility = by[k].n ? Math.round((100 * by[k].score) / by[k].n) : null; });
  return by;
}

function debateMarkdown(d) {
  var out = '# Debate: ' + d.motion + '\n\n';
  (d.transcript || []).forEach(function (t) { out += '## ' + t.name + ' (' + (t.side === 'pro' ? 'Proposition' : 'Opposition') + ') — ' + t.phase + (t.human ? ' [human]' : '') + '\n\n' + t.text + '\n\n'; });
  var v = d.verdict;
  if (v) {
    out += '## Verdict\n\n**Winner:** ' + (d.names[v.winner] || v.winner) + ' (' + v.margin + ') · Pro ' + totalScore(v.scores, 'pro') + '/40 · Con ' + totalScore(v.scores, 'con') + '/40\n\n' + v.reasoning + '\n\n';
    (v.clashes || []).forEach(function (c) { out += '- **' + c.topic + '** → ' + c.winner + ': pro “' + c.pro + '” vs con “' + c.con + '”\n'; });
  }
  if (d.votes && d.votes.post != null) out += '\n## Audience\n\nBefore: ' + d.votes.pre + '% for · After: ' + d.votes.post + '% for · ' + voteSwing(d.votes.pre, d.votes.post).label + '\n';
  if (d.checks && d.checks.length) {
    out += '\n## Fact check\n\n';
    d.checks.forEach(function (c) { out += '- [' + c.verdict + '] (' + c.side + ') ' + c.claim + ' — ' + c.note + '\n'; });
  }
  return out;
}
