const pptxgen = require('pptxgenjs');

const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';
pptx.author = 'SIH Prototype Team';
pptx.subject = 'Smart India Hackathon - Skills Gap and Employment Tracking Dashboard';
pptx.title = 'SIH Prototype - Skills Gap and Employment Tracking Dashboard';
pptx.company = 'SIH Prototype Team';
pptx.lang = 'en-US';
pptx.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'en-US',
};
pptx.defineSlideMaster({
  title: 'MASTER',
  background: { color: 'FFFFFF' },
  objects: [
    { text: { text: 'SOLO LEVELING', options: { x: 0.58, y: 0.16, w: 1.55, h: 0.18, fontFace: 'Aptos', fontSize: 7.5, bold: true, color: 'FF9933', charSpacing: 1.5, margin: 0 } } },
    { rect: { x: 10.52, y: 0.1, w: 2.25, h: 0.42, fill: { color: 'FFFFFF', transparency: 8 }, line: { color: 'D6DCE4', transparency: 25, width: 0.6 } } },
    { rect: { x: 10.7, y: 0.19, w: 0.52, h: 0.06, fill: { color: 'FF9933' }, line: { color: 'FF9933' } } },
    { rect: { x: 10.7, y: 0.28, w: 0.52, h: 0.06, fill: { color: '138A4B' }, line: { color: '138A4B' } } },
    { text: { text: 'SMART INDIA\nHACKATHON', options: { x: 11.34, y: 0.14, w: 1.22, h: 0.3, fontFace: 'Aptos', fontSize: 6.2, bold: true, color: '163456', breakLine: false, fit: 'shrink', margin: 0, valign: 'mid' } } },
    { rect: { x: 0, y: 7.32, w: 4.444, h: 0.18, fill: { color: 'FF9933' }, line: { color: 'FF9933' } } },
    { rect: { x: 4.444, y: 7.32, w: 4.445, h: 0.18, fill: { color: 'FFFFFF' }, line: { color: 'FFFFFF' } } },
    { rect: { x: 8.889, y: 7.32, w: 4.444, h: 0.18, fill: { color: '138A4B' }, line: { color: '138A4B' } } },
    { text: { text: 'SIH PROTOTYPE  /  SMART INDIA HACKATHON', options: { x: 0.55, y: 7.06, w: 5.3, h: 0.18, fontFace: 'Aptos', fontSize: 7.5, bold: true, color: '5B6770', charSpacing: 1.1, margin: 0 } } },
  ],
  slideNumber: { x: 12.35, y: 7.04, color: '5B6770', fontFace: 'Aptos', fontSize: 8 },
});

const C = {
  navy: '163456', navy2: '0057A8', blue: '0057A8', teal: '138A4B', aqua: 'E8F5EE',
  orange: 'FF9933', orangePale: 'FFF1DF', ink: '14213D', muted: '46515C', line: 'D6DCE4',
  white: 'FFFFFF', bg: 'FFFFFF', red: 'D8433E', redPale: 'FBE9E7', green: '138A4B', greenPale: 'E8F5EE',
};
const W = 13.333;
const H = 7.5;

function tx(slide, text, x, y, w, h, opts = {}) {
  slide.addText(text, { x, y, w, h, fontFace: opts.fontFace || 'Aptos', fontSize: opts.fontSize || 14, color: opts.color || C.ink, bold: opts.bold || false, margin: opts.margin === undefined ? 0 : opts.margin, breakLine: false, fit: 'shrink', valign: opts.valign || 'mid', align: opts.align || 'left', italic: opts.italic || false, charSpacing: opts.charSpacing || 0, bullet: opts.bullet, paraSpaceAfterPt: opts.paraSpaceAfterPt, transparency: opts.transparency });
}
function rect(slide, x, y, w, h, fill, radius = 0.12, line = fill) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h, rectRadius: radius, fill: { color: fill }, line: { color: line, transparency: line === fill ? 100 : 0, width: 1 } });
}
function line(slide, x1, y1, x2, y2, color = C.line, width = 1.2, dash = 'solid') {
  slide.addShape(pptx.ShapeType.line, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color, width, dashType: dash, beginArrowType: 'none', endArrowType: 'none' } });
}
function circle(slide, x, y, d, fill, lineColor = fill) {
  slide.addShape(pptx.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: fill }, line: { color: lineColor, transparency: 100 } });
}
function title(slide, kicker, heading, sub) {
  tx(slide, kicker.toUpperCase(), 0.68, 0.42, 5.5, 0.22, { fontSize: 9, bold: true, color: C.teal, charSpacing: 1.8 });
  tx(slide, heading, 0.68, 0.72, 11.8, 0.55, { fontSize: 27, bold: true, color: C.navy });
  if (sub) tx(slide, sub, 0.7, 1.35, 11.6, 0.35, { fontSize: 11.5, color: C.muted });
}
function pill(slide, text, x, y, w, fill, color = C.navy) {
  rect(slide, x, y, w, 0.3, fill, 0.15, fill);
  tx(slide, text, x, y + 0.02, w, 0.24, { fontSize: 8.5, bold: true, color, align: 'center' });
}
function metric(slide, x, y, w, value, label, accent = C.teal) {
  rect(slide, x, y, w, 0.92, C.white, 0.1, C.line);
  rect(slide, x, y, 0.06, 0.92, accent, 0, accent);
  tx(slide, value, x + 0.22, y + 0.13, w - 0.3, 0.3, { fontSize: 22, bold: true, color: C.navy });
  tx(slide, label, x + 0.22, y + 0.53, w - 0.3, 0.2, { fontSize: 8.5, color: C.muted });
}
function miniBar(slide, x, y, w, value, color = C.teal) {
  rect(slide, x, y, w, 0.11, 'E7EDF4', 0.05, 'E7EDF4');
  rect(slide, x, y, w * value, 0.11, color, 0.05, color);
}
function addCheck(slide, text, x, y, color = C.teal) {
  circle(slide, x, y + 0.02, 0.17, color);
  tx(slide, '✓', x, y - 0.005, 0.17, 0.17, { fontSize: 9, bold: true, color: C.white, align: 'center' });
  tx(slide, text, x + 0.27, y, 4.7, 0.22, { fontSize: 11, color: C.ink });
}
function node(slide, x, y, label, sub, fill, textColor = C.white) {
  circle(slide, x, y, 0.42, fill);
  tx(slide, label, x + 0.01, y + 0.06, 0.4, 0.26, { fontSize: 11, bold: true, color: textColor, align: 'center' });
  tx(slide, sub, x - 0.3, y + 0.53, 1.05, 0.32, { fontSize: 9, bold: true, color: C.navy, align: 'center' });
}

/*
// 1. Title + problem signal
{
  const s = pptx.addSlide('MASTER');
  s.background = { color: C.navy };
  tx(s, 'SMART INDIA HACKATHON  /  SIH PROTOTYPE', 0.72, 0.68, 6.4, 0.22, { fontSize: 9, bold: true, color: C.orange, charSpacing: 1.5 });
  tx(s, 'Skills gap &\nemployment tracking', 0.7, 1.45, 7.4, 1.35, { fontSize: 32, bold: true, color: C.white, valign: 'top' });
  tx(s, 'SkillTrack makes the next career move visible.', 0.74, 3.25, 6.8, 0.36, { fontSize: 16, color: 'BFD0E5' });
  const flow = [['LEARN', C.blue], ['MEASURE', C.teal], ['MATCH', C.orange], ['PLACE', C.white]];
  flow.forEach(([label, color], i) => {
    const x = 0.82 + i * 1.85;
    circle(s, x, 5.0, 0.7, color);
    tx(s, label, x - 0.1, 5.88, 0.9, 0.2, { fontSize: 8, bold: true, color: C.white, align: 'center' });
    if (i < flow.length - 1) line(s, x + 0.72, 5.35, x + 1.72, 5.35, C.teal, 2);
  });
  rect(s, 8.4, 1.35, 3.8, 4.65, C.navy2, 0.18, C.navy2);
  tx(s, 'THE GAP', 8.82, 1.85, 1.4, 0.2, { fontSize: 9, bold: true, color: C.orange, charSpacing: 1.6 });
  [['Skills', C.red], ['Jobs', C.orange], ['Feedback', C.blue]].forEach((item, i) => {
    const y = 2.55 + i * 0.82;
    rect(s, 8.82, y, 2.95, 0.48, 'FFFFFF', 0.08, 'FFFFFF');
    tx(s, item[0], 9.05, y + 0.13, 1.45, 0.18, { fontSize: 12, bold: true, color: C.navy });
    circle(s, 11.1, y + 0.12, 0.22, item[1]);
    if (i < 2) line(s, 10.28, y + 0.55, 10.28, y + 0.78, '8EA7C3', 1.2);
  });
  tx(s, 'fragmented  →  actionable', 8.82, 5.35, 2.95, 0.25, { fontSize: 14, bold: true, color: C.white, align: 'center' });
}

// 2. Problem, SkillTrack, and technical approach
{
  const s = pptx.addSlide('MASTER');
  title(s, '01 / Unified flow', 'From fragmented signals to employment action', 'Problem signals, product logic, and technology become one visual pipeline.');
  const signals = [['SKILLS', C.red], ['JOBS', C.orange], ['FEEDBACK', C.blue]];
  signals.forEach((item, i) => {
    const y = 2.12 + i * 0.68;
    rect(s, 0.82, y, 1.65, 0.42, C.white, 0.08, C.line);
    circle(s, 1.02, y + 0.1, 0.22, item[1]);
    tx(s, item[0], 1.38, y + 0.11, 0.8, 0.16, { fontSize: 9, bold: true, color: C.navy });
  });
  tx(s, 'SIGNALS', 0.92, 1.78, 1.2, 0.18, { fontSize: 9, bold: true, color: C.teal, charSpacing: 1.2 });
  line(s, 2.62, 3.1, 3.35, 3.1, C.line, 1.8);
  rect(s, 3.45, 2.02, 2.25, 2.18, C.navy, 0.16, C.navy);
  tx(s, 'SKILLTRACK', 3.75, 2.38, 1.65, 0.22, { fontSize: 14, bold: true, color: C.white, align: 'center' });
  const core = [['PROFILE', C.blue], ['GAP ENGINE', C.teal], ['MATCH', C.orange], ['TRACK', C.white]];
  core.forEach((item, i) => {
    const y = 2.88 + i * 0.29;
    circle(s, 3.78, y, 0.16, item[1]);
    tx(s, item[0], 4.12, y - 0.01, 1.1, 0.15, { fontSize: 8, bold: true, color: 'D8E5F3' });
  });
  line(s, 5.82, 3.1, 6.55, 3.1, C.line, 1.8);
  const tech = [['INPUT', 'profile + resume + jobs', C.blue], ['ENGINE', 'extract + score + rank', C.orange], ['OUTPUT', 'dashboard + next action', C.teal]];
  tech.forEach((item, i) => {
    const x = 6.65 + i * 2.05;
    rect(s, x, 2.52, 1.75, 1.16, item[2], 0.1, item[2]);
    tx(s, item[0], x + 0.12, 2.72, 1.5, 0.16, { fontSize: 9, bold: true, color: C.white, align: 'center' });
    tx(s, item[1], x + 0.16, 3.04, 1.43, 0.34, { fontSize: 8, color: C.white, align: 'center', valign: 'top' });
    if (i < tech.length - 1) tx(s, '→', x + 1.78, 2.91, 0.25, 0.2, { fontSize: 16, bold: true, color: C.teal, align: 'center' });
  });
  tx(s, 'CLOSED LOOP', 0.92, 4.78, 1.4, 0.18, { fontSize: 9, bold: true, color: C.teal, charSpacing: 1.2 });
  const outcomes = [['72%', 'readiness', C.teal], ['08', 'roles matched', C.blue], ['04', 'applications', C.orange], ['1', 'next action', C.navy]];
  outcomes.forEach((item, i) => {
    const x = 2.1 + i * 2.55;
    rect(s, x, 4.58, 2.08, 0.72, C.white, 0.08, C.line);
    tx(s, item[0], x + 0.16, 4.75, 0.55, 0.2, { fontSize: 16, bold: true, color: item[2] });
    tx(s, item[1], x + 0.82, 4.78, 1.05, 0.16, { fontSize: 8.5, color: C.muted });
    if (i < outcomes.length - 1) tx(s, '→', x + 2.15, 4.8, 0.25, 0.2, { fontSize: 14, color: C.teal, align: 'center' });
  });
  tx(s, 'evidence → action → feedback → better match', 2.3, 6.08, 8.7, 0.25, { fontSize: 15, bold: true, color: C.navy, align: 'center' });
}

*/

// 2. Merged hero flow
{
  const s = pptx.addSlide('MASTER');
  s.background = { color: C.navy };
  tx(s, 'SMART INDIA HACKATHON  /  SIH PROTOTYPE', 0.72, 0.68, 6.4, 0.22, { fontSize: 9, bold: true, color: C.orange, charSpacing: 1.5 });
  tx(s, 'From scattered signals\nto one clear career move', 0.72, 1.2, 6.5, 1.0, { fontSize: 28, bold: true, color: C.white, valign: 'top' });
  tx(s, 'SkillTrack connects evidence, intelligence and action in one visual loop.', 0.76, 2.42, 6.3, 0.3, { fontSize: 14, bold: true, color: 'D8E5F3' });
  tx(s, 'THE JOURNEY', 0.8, 3.25, 1.4, 0.18, { fontSize: 9, bold: true, color: C.orange, charSpacing: 1.5 });
  const journey = [
    ['01', 'SIGNALS', 'skills\njobs\nfeedback', C.red],
    ['02', 'SKILLTRACK', 'profile\ngap engine\nmatch', C.blue],
    ['03', 'ACTION', 'learn\napply\ntrack', C.orange],
    ['04', 'OUTCOME', 'readiness\nplacement\nprogress', C.teal],
  ];
  line(s, 1.22, 4.18, 7.55, 4.18, '3D6B93', 2);
  journey.forEach((item, i) => {
    const x = 0.82 + i * 2.05;
    circle(s, x, 3.78, 0.8, item[3]);
    tx(s, item[0], x, 4.05, 0.8, 0.18, { fontSize: 11, bold: true, color: C.white, align: 'center' });
    tx(s, item[1], x - 0.25, 4.85, 1.3, 0.2, { fontSize: 10, bold: true, color: C.white, align: 'center' });
    tx(s, item[2], x - 0.25, 5.2, 1.3, 0.5, { fontSize: 9.5, bold: true, color: 'D8E5F3', align: 'center', valign: 'top' });
    if (i < journey.length - 1) tx(s, '->', x + 1.43, 4.02, 0.45, 0.2, { fontSize: 18, bold: true, color: C.teal, align: 'center' });
  });
  rect(s, 8.28, 1.28, 4.15, 4.9, C.navy2, 0.18, C.navy2);
  tx(s, 'THE TRANSFORMATION', 8.72, 1.75, 2.9, 0.18, { fontSize: 9, bold: true, color: C.orange, charSpacing: 1.4, align: 'center' });
  const transform = [['INPUT', 'resume + jobs', C.white], ['INTELLIGENCE', 'extract + score', C.orange], ['OUTPUT', 'next best action', C.teal]];
  transform.forEach((item, i) => {
    const y = 2.35 + i * 0.92;
    rect(s, 8.75, y, 3.2, 0.52, item[2], 0.08, item[2]);
    tx(s, item[0], 9.0, y + 0.08, 1.15, 0.16, { fontSize: 9.5, bold: true, color: i === 0 ? C.navy : C.white });
    tx(s, item[1], 10.25, y + 0.08, 1.35, 0.16, { fontSize: 10, bold: true, color: i === 0 ? C.navy : C.white });
    if (i < transform.length - 1) tx(s, '↓', 10.2, y + 0.58, 0.25, 0.2, { fontSize: 15, bold: true, color: C.white, align: 'center' });
  });
  tx(s, 'evidence  ->  insight  ->  movement', 8.72, 5.45, 3.3, 0.22, { fontSize: 12, bold: true, color: C.white, align: 'center' });
  tx(s, 'A career dashboard that turns uncertainty into a next step.', 1.1, 6.55, 7.2, 0.22, { fontSize: 13, bold: true, color: C.white, align: 'center' });
}

// 3. Dedicated technical approach
{
  const s = pptx.addSlide('MASTER');
  title(s, '02 / Technical approach', 'How SkillTrack turns data into action', 'A modular architecture connects the user, application logic, data, AI parsing, and skill-gap intelligence.');
  tx(s, 'USER LAYER', 0.82, 1.95, 1.4, 0.18, { fontSize: 9, bold: true, color: C.teal, charSpacing: 1.2 });
  const flow = [
    ['BROWSER', 'student input\nresume + jobs', C.blue],
    ['NEXT.JS', 'App Router\nUI + API routes', C.orange],
    ['SUPABASE', 'Auth +\nPostgreSQL', C.teal],
    ['OPENAI', 'AI career\nrecommendations', C.navy2],
  ];
  flow.forEach((item, i) => {
    const x = 0.82 + i * 3.05;
    rect(s, x, 2.28, 2.28, 0.92, item[2], 0.1, item[2]);
    tx(s, item[0], x + 0.12, 2.46, 2.04, 0.18, { fontSize: 11, bold: true, color: C.white, align: 'center' });
    tx(s, item[1], x + 0.12, 2.72, 2.04, 0.28, { fontSize: 10, bold: true, color: C.white, align: 'center', valign: 'top' });
    if (i < flow.length - 1) tx(s, '→', x + 2.38, 2.58, 0.48, 0.25, { fontSize: 21, bold: true, color: C.teal, align: 'center' });
  });
  tx(s, 'PROCESSING PIPELINE', 0.82, 3.72, 2.1, 0.18, { fontSize: 9, bold: true, color: C.teal, charSpacing: 1.2 });
  const process = [
    ['PARSE', 'unpdf + mammoth\nresume text', C.orange],
    ['NORMALIZE', 'skills, roles,\nrequirements', C.blue],
    ['SCORE', 'match % +\nmissing skills', C.teal],
    ['RECOMMEND', 'next best\naction', C.navy],
  ];
  process.forEach((item, i) => {
    const x = 0.82 + i * 3.05;
    rect(s, x, 4.05, 2.28, 0.94, C.white, 0.1, C.line);
    circle(s, x + 0.18, 4.28, 0.34, item[2]);
    tx(s, item[0], x + 0.68, 4.2, 1.36, 0.16, { fontSize: 9, bold: true, color: item[2] });
    tx(s, item[1], x + 0.68, 4.48, 1.36, 0.3, { fontSize: 9.5, bold: true, color: C.muted, valign: 'top' });
    if (i < process.length - 1) tx(s, '→', x + 2.38, 4.37, 0.48, 0.25, { fontSize: 21, bold: true, color: C.teal, align: 'center' });
  });
  tx(s, 'PRODUCT OUTPUT', 0.82, 5.48, 1.6, 0.18, { fontSize: 9, bold: true, color: C.teal, charSpacing: 1.2 });
  const outputs = [['MATCH %', C.blue], ['MATCHED SKILLS', C.teal], ['MISSING SKILLS', C.orange], ['IMPROVING SKILLS', C.navy]];
  outputs.forEach((item, i) => {
    const x = 2.65 + i * 2.45;
    rect(s, x, 5.35, 1.9, 0.52, item[1], 0.08, item[1]);
    tx(s, item[0], x + 0.08, 5.51, 1.74, 0.15, { fontSize: 9, bold: true, color: C.white, align: 'center' });
  });
  tx(s, 'Next.js 16  •  React 19  •  TypeScript  •  Tailwind CSS 4', 2.0, 6.28, 9.2, 0.2, { fontSize: 10, bold: true, color: C.navy, align: 'center' });
}

/*
// 4. Skill gap to employment funnel
{
  const s = pptx.addSlide('MASTER');
  title(s, '03 / Intelligence + impact', 'Turn a vague gap into measurable movement', 'Priority gaps feed learning actions, job matches, employment outcomes, and scale.');
  tx(s, 'TARGET ROLE', 0.8, 2.0, 1.4, 0.2, { fontSize: 9, bold: true, color: C.teal, charSpacing: 1.4 });
  rect(s, 0.8, 2.38, 2.55, 1.05, C.navy, 0.12, C.navy);
  tx(s, 'Product analyst', 1.08, 2.62, 2.0, 0.25, { fontSize: 18, bold: true, color: C.white });
  tx(s, '72% ready', 1.08, 3.0, 1.6, 0.18, { fontSize: 10, color: C.teal });
  line(s, 3.55, 2.9, 4.35, 2.9, C.line, 1.7);
  const funnel = [
    ['PRIORITIZE', 'SQL / analytics', C.red, 2.2],
    ['PRACTICE', 'case study plan', C.orange, 2.7],
    ['MATCH', '8 real-fit roles', C.blue, 3.2],
    ['TRACK', 'application outcome', C.teal, 3.7],
  ];
  funnel.forEach((item, i) => {
    const y = 2.15 + i * 1.0;
      tx(s, 'TARGET ROLE', 0.8, 2.0, 1.4, 0.2, { fontSize: 9, bold: true, color: C.teal, charSpacing: 1.4 });
      rect(s, 0.8, 2.38, 2.55, 1.05, C.navy, 0.12, C.navy);
      tx(s, 'Product analyst', 1.08, 2.62, 2.0, 0.25, { fontSize: 18, bold: true, color: C.white });
      tx(s, '72% ready', 1.08, 3.0, 1.6, 0.18, { fontSize: 10, color: C.teal });
      line(s, 3.55, 2.9, 4.35, 2.9, C.line, 1.7);
      const funnel = [
        ['PRIORITIZE', 'SQL / analytics', C.red, 2.2],
        ['PRACTICE', 'case study plan', C.orange, 2.7],
        ['MATCH', '8 real-fit roles', C.blue, 3.2],
        ['TRACK', 'application outcome', C.teal, 3.7],
      ];
      funnel.forEach((item, i) => {
        const y = 2.15 + i * 1.0;
        const x = 4.45 + i * 0.35;
        rect(s, x, y, item[3], 0.62, item[2], 0.08, item[2]);
        tx(s, item[0], x + 0.18, y + 0.1, 1.2, 0.16, { fontSize: 9, bold: true, color: C.white });
        tx(s, item[1], x + 1.35, y + 0.1, item[3] - 1.5, 0.18, { fontSize: 10, color: C.white });
        if (i < funnel.length - 1) tx(s, '↓', x + item[3] - 0.25, y + 0.68, 0.25, 0.22, { fontSize: 14, bold: true, color: C.muted, align: 'center' });
      });
      rect(s, 0.8, 4.2, 2.55, 1.85, C.aqua, 0.12, C.aqua);
      tx(s, 'FEEDBACK SIGNAL', 1.08, 4.52, 1.7, 0.18, { fontSize: 9, bold: true, color: C.teal, charSpacing: 1.1 });
      tx(s, 'Interview feedback\nchanges the next plan.', 1.08, 4.92, 2.0, 0.48, { fontSize: 14, bold: true, color: C.navy, valign: 'top' });
      tx(s, 'IMPACT SIGNALS', 0.8, 5.55, 1.5, 0.18, { fontSize: 9, bold: true, color: C.teal, charSpacing: 1.2 });
      const impact = [['+25%', 'relevant applications', C.teal], ['-40%', 'search time', C.blue], ['2×', 'feedback speed', C.orange]];
      impact.forEach((item, i) => {
        const x = 2.45 + i * 2.0;
        rect(s, x, 5.42, 1.7, 0.56, C.white, 0.08, C.line);
        tx(s, item[0], x + 0.12, 5.53, 0.55, 0.2, { fontSize: 14, bold: true, color: item[2] });
        tx(s, item[1], x + 0.72, 5.57, 0.82, 0.18, { fontSize: 7.5, color: C.muted });
      });
      tx(s, 'SCALE PATH', 8.7, 5.55, 1.0, 0.18, { fontSize: 9, bold: true, color: C.teal, charSpacing: 1.1 });
      tx(s, 'NOW  →  NEXT  →  LATER', 9.85, 5.55, 2.25, 0.18, { fontSize: 10, bold: true, color: C.navy, align: 'right' });
      tx(s, 'student dashboard  →  demand signals  →  institution ecosystem', 8.7, 5.87, 3.4, 0.18, { fontSize: 8, color: C.muted, align: 'right' });
      tx(s, 'SKILLTRACK  /  SMART INDIA HACKATHON  /  JAI HIND', 0.8, 6.55, 6.6, 0.22, { fontSize: 10, bold: true, color: C.orange, charSpacing: 1.1 });
    tx(s, item[1], x + 1.35, y + 0.1, item[3] - 1.5, 0.18, { fontSize: 10, color: C.white });
    if (i < funnel.length - 1) tx(s, '↓', x + item[3] - 0.25, y + 0.68, 0.25, 0.22, { fontSize: 14, bold: true, color: C.muted, align: 'center' });
  });
  rect(s, 0.8, 4.2, 2.55, 1.85, C.aqua, 0.12, C.aqua);
  tx(s, 'FEEDBACK SIGNAL', 1.08, 4.52, 1.7, 0.18, { fontSize: 9, bold: true, color: C.teal, charSpacing: 1.1 });
  tx(s, 'Interview feedback\nchanges the next plan.', 1.08, 4.92, 2.0, 0.48, { fontSize: 14, bold: true, color: C.navy, valign: 'top' });
  tx(s, 'IMPACT SIGNALS', 0.8, 5.55, 1.5, 0.18, { fontSize: 9, bold: true, color: C.teal, charSpacing: 1.2 });
  const impact = [['+25%', 'relevant applications', C.teal], ['-40%', 'search time', C.blue], ['2×', 'feedback speed', C.orange]];
  impact.forEach((item, i) => {
    const x = 2.45 + i * 2.0;
    rect(s, x, 5.42, 1.7, 0.56, C.white, 0.08, C.line);
    tx(s, item[0], x + 0.12, 5.53, 0.55, 0.2, { fontSize: 14, bold: true, color: item[2] });
    tx(s, item[1], x + 0.72, 5.57, 0.82, 0.18, { fontSize: 7.5, color: C.muted });
  });
  tx(s, 'SCALE PATH', 8.7, 5.55, 1.0, 0.18, { fontSize: 9, bold: true, color: C.teal, charSpacing: 1.1 });
  tx(s, 'NOW  →  NEXT  →  LATER', 9.85, 5.55, 2.25, 0.18, { fontSize: 10, bold: true, color: C.navy, align: 'right' });
  tx(s, 'student dashboard  →  demand signals  →  institution ecosystem', 8.7, 5.87, 3.4, 0.18, { fontSize: 8, color: C.muted, align: 'right' });
  tx(s, 'SKILLTRACK  /  SMART INDIA HACKATHON  /  JAI HIND', 0.8, 6.55, 6.6, 0.22, { fontSize: 10, bold: true, color: C.orange, charSpacing: 1.1 });
}
*/

// 4. Feasibility, viability, and impact
{
  const s = pptx.addSlide('MASTER');
  title(s, '03 / Feasibility + impact', 'Ready to scale, built to learn', 'A production-ready stack becomes valuable when risks are controlled and outcomes are measurable.');
  const stages = [
    ['FEASIBLE', 'Next.js + Supabase + OpenAI', C.blue],
    ['CONTROL', 'RLS + validation + rate limits', C.orange],
    ['DELIVER', 'trusted guidance + better decisions', C.teal],
  ];
  stages.forEach((item, i) => {
    const x = 0.9 + i * 4.1;
    rect(s, x, 2.12, 3.25, 1.05, item[2], 0.12, item[2]);
    tx(s, item[0], x + 0.18, 2.32, 2.9, 0.18, { fontSize: 12, bold: true, color: C.white, align: 'center' });
    tx(s, item[1], x + 0.28, 2.65, 2.7, 0.2, { fontSize: 10, bold: true, color: C.white, align: 'center' });
    if (i < stages.length - 1) tx(s, '→', x + 3.36, 2.48, 0.5, 0.25, { fontSize: 22, bold: true, color: C.teal, align: 'center' });
  });
  tx(s, 'RISK → MITIGATION', 0.9, 3.72, 2.0, 0.18, { fontSize: 9, bold: true, color: C.teal, charSpacing: 1.2 });
  const risks = [
    ['No jobs API', 'Integrate live job-board API', C.blue],
    ['Unsafe uploads', 'Malware scan + file limits', C.orange],
    ['Untrusted AI', 'Schema validation + tests', C.red],
    ['Data exposure', 'Supabase RLS policies', C.teal],
  ];
  risks.forEach((item, i) => {
    const x = 0.9 + i * 3.05;
    rect(s, x, 4.05, 2.55, 0.72, C.white, 0.08, C.line);
    circle(s, x + 0.18, 4.23, 0.28, item[2]);
    tx(s, item[0], x + 0.62, 4.18, 1.72, 0.16, { fontSize: 9, bold: true, color: C.navy });
    tx(s, item[1], x + 0.62, 4.43, 1.72, 0.18, { fontSize: 9, bold: true, color: C.muted });
  });
  tx(s, 'MEASURABLE BENEFITS', 0.9, 5.28, 2.2, 0.18, { fontSize: 9, bold: true, color: C.teal, charSpacing: 1.2 });
  const benefits = [
    ['SOCIAL', 'multilingual guidance', C.blue],
    ['ECONOMIC', 'targeted upskilling', C.orange],
    ['INSTITUTIONAL', 'readiness evidence', C.teal],
  ];
  benefits.forEach((item, i) => {
    const x = 3.15 + i * 3.15;
    rect(s, x, 5.12, 2.65, 0.62, item[2], 0.12, item[2]);
    tx(s, item[0], x + 0.12, 5.24, 2.4, 0.16, { fontSize: 9, bold: true, color: C.white, align: 'center' });
    tx(s, item[1], x + 0.12, 5.48, 2.4, 0.14, { fontSize: 9, bold: true, color: C.white, align: 'center' });
  });
  tx(s, 'controlled risk → trusted insight → measurable employment movement', 1.7, 6.25, 10.0, 0.22, { fontSize: 13, bold: true, color: C.navy, align: 'center' });
}

// 5. Research and references
{
  const s = pptx.addSlide('MASTER');
  title(s, '04 / Research + references', 'Proven tools. Connected with purpose.', 'Every technology choice moves through a visible path from trusted documentation to a working student outcome.');
  const sources = [
    ['01', 'LEARN', 'Next.js docs\nSupabase docs', C.blue],
    ['02', 'BUILD', 'React + TypeScript\nTailwind CSS', C.orange],
    ['03', 'INTELLIGENCE', 'OpenAI API\nunpdf + mammoth', C.teal],
    ['04', 'SHIP', 'Vercel\nproduction deploy', C.navy],
  ];
  line(s, 1.45, 3.08, 11.9, 3.08, C.line, 2);
  sources.forEach((item, i) => {
    const x = 0.92 + i * 3.05;
    circle(s, x, 2.58, 0.88, item[3]);
    tx(s, item[0], x, 2.88, 0.88, 0.18, { fontSize: 12, bold: true, color: C.white, align: 'center' });
    tx(s, item[1], x - 0.3, 3.72, 1.5, 0.18, { fontSize: 10, bold: true, color: C.navy, align: 'center' });
    tx(s, item[2], x - 0.3, 4.08, 1.5, 0.42, { fontSize: 10, bold: true, color: C.muted, align: 'center', valign: 'top' });
    if (i < sources.length - 1) tx(s, '->', x + 1.78, 2.88, 0.55, 0.2, { fontSize: 18, bold: true, color: C.teal, align: 'center' });
  });
  rect(s, 1.0, 5.18, 11.35, 0.8, C.navy, 0.12, C.navy);
  tx(s, 'EVIDENCE-BACKED BUILD', 1.35, 5.39, 2.2, 0.18, { fontSize: 10, bold: true, color: C.orange, charSpacing: 1.2 });
  tx(s, 'Documentation -> implementation -> validation -> impact', 3.85, 5.34, 7.95, 0.25, { fontSize: 15, bold: true, color: C.white, align: 'center' });
  tx(s, 'Sources: nextjs.org/docs  |  supabase.com/docs  |  platform.openai.com/docs  |  vercel.com/docs', 1.05, 6.28, 11.2, 0.2, { fontSize: 9, bold: true, color: C.muted, align: 'center' });
}

// 6. Roadmap to production
{
  const s = pptx.addSlide('MASTER');
  title(s, '05 / Roadmap to production', 'From working prototype to trusted rollout', 'Every release gate reduces risk before SkillTrack reaches real learners.');
  const stages = [
    ['01', 'PROTOTYPE', 'Core journey live', 'Next.js + Supabase + OpenAI', C.blue],
    ['02', 'SECURE', 'Protect people + data', 'RLS + server-only key + upload limits', C.orange],
    ['03', 'VALIDATE', 'Prove every decision', 'Schema checks + scoring + failure tests', C.red],
    ['04', 'PILOT', 'Learn with real users', 'Campus cohort + feedback + monitoring', C.teal],
    ['05', 'SCALE', 'Expand with confidence', 'Jobs API + institutions + deployment', C.navy],
  ];
  line(s, 1.15, 3.02, 12.0, 3.02, C.line, 2);
  stages.forEach((item, i) => {
    const x = 0.72 + i * 2.52;
    circle(s, x + 0.67, 2.6, 0.84, item[4]);
    tx(s, item[0], x + 0.67, 2.88, 0.84, 0.18, { fontSize: 12, bold: true, color: C.white, align: 'center' });
    if (i === 0) {
      rect(s, x + 0.77, 3.17, 0.64, 0.34, C.blue, 0.04, C.blue);
      line(s, x + 0.88, 3.25, x + 1.3, 3.25, C.white, 1);
      line(s, x + 0.88, 3.34, x + 1.18, 3.34, C.white, 1);
    } else if (i === 1) {
      circle(s, x + 0.91, 3.17, 0.36, C.orange);
      line(s, x + 1.0, 3.35, x + 1.08, 3.43, C.white, 1.5);
      line(s, x + 1.08, 3.43, x + 1.22, 3.22, C.white, 1.5);
    } else if (i === 2) {
      circle(s, x + 0.91, 3.17, 0.36, C.red);
      tx(s, 'OK', x + 0.91, 3.27, 0.36, 0.12, { fontSize: 6.5, bold: true, color: C.white, align: 'center' });
    } else if (i === 3) {
      circle(s, x + 0.82, 3.2, 0.18, C.teal);
      circle(s, x + 1.2, 3.2, 0.18, C.teal);
      circle(s, x + 1.01, 3.38, 0.18, C.teal);
      line(s, x + 0.97, 3.28, x + 1.05, 3.38, C.teal, 1);
      line(s, x + 1.23, 3.28, x + 1.12, 3.38, C.teal, 1);
    } else {
      rect(s, x + 0.84, 3.36, 0.12, 0.16, C.navy, 0, C.navy);
      rect(s, x + 1.02, 3.27, 0.12, 0.25, C.navy, 0, C.navy);
      rect(s, x + 1.2, 3.17, 0.12, 0.35, C.navy, 0, C.navy);
    }
    tx(s, item[1], x, 3.7, 2.18, 0.2, { fontSize: 11, bold: true, color: C.navy, align: 'center' });
    tx(s, item[2], x, 4.06, 2.18, 0.22, { fontSize: 10, bold: true, color: item[4], align: 'center' });
    tx(s, item[3], x - 0.04, 4.39, 2.26, 0.5, { fontSize: 10, bold: true, color: C.navy, align: 'center', valign: 'top' });
    if (i < stages.length - 1) tx(s, '->', x + 2.13, 2.9, 0.36, 0.2, { fontSize: 16, bold: true, color: C.teal, align: 'center' });
  });
  rect(s, 0.9, 5.35, 11.55, 0.75, C.navy, 0.12, C.navy);
  tx(s, 'RELEASE GATE', 1.25, 5.57, 1.35, 0.18, { fontSize: 9, bold: true, color: C.orange, charSpacing: 1.2 });
  tx(s, 'Only ship when ownership, safety, model output, and failure paths are tested.', 2.95, 5.5, 8.95, 0.26, { fontSize: 13, bold: true, color: C.white, align: 'center' });
  tx(s, 'prototype -> safeguards -> evidence -> users -> scale', 2.0, 6.35, 9.3, 0.2, { fontSize: 11, bold: true, color: C.navy, align: 'center' });
}

pptx.writeFile({ fileName: 'public/skills-final-merged.pptx' });
