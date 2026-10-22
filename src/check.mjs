import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const RULES = [
  ['STYLE-01', 'Remove stock AI vocabulary', /\b(?:delve|pivotal|seamless|leverage|unlock|empower|robust|testament)\b/i],
  ['STYLE-02', 'Start with the point, without a staged introduction', /\b(?:let'?s dive in|in this essay|in this article|the broader issue is straightforward|the key takeaway is|it'?s important to note|at its core|in today'?s rapidly evolving)\b/i],
  ['STYLE-03', 'Check formulaic negative contrast', /\bnot\s+(?:just|only|merely)\b[^.!?]{0,100}\bbut\b|\bit'?s not\b[^.!?]{0,90}\bit'?s\b/i],
  ['STYLE-04', 'Use prose punctuation rather than dashes', /\u2014|(?<!\d)\u2013|\u2013(?!\d)/],
  ['STYLE-05', 'Use month-first dates in prose', /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/i]
];
const GENERIC_HEADING = /^(?:overview|introduction|background|summary|scope|why it matters|the bottom line|key takeaways|final thoughts|in conclusion|the result)$/i;
const VAGUE_MD_LINK = /\[(?:here|click here|learn more)\]\s*\(/i;
const VAGUE_HTML_LINK = /<a\b[^>]*>\s*(?:here|click here|learn more)\s*<\/a>/i;
const HEAD_HTML = /<h[1-3]\b[^>]*>(.*?)<\/h[1-3]>/i;

/** Keep generated-code and Markdown metadata out of prose checks. Findings are suggestions for editorial review. */
export function lintSource(file, source, options = {}) {
  const enabled = options.rules ?? {};
  const selected = options.selectedLines ? new Set(options.selectedLines) : null;
  const results = [];
  const lines = source.split(/\r?\n/);
  let fenced = false;
  let fenceChar = '';
  let frontmatter = /\.mdx?$/.test(file) && /^---\s*$/.test(lines[0] ?? '');
  for (let i=0; i<lines.length; i++) {
    const raw = lines[i];
    const lineNo = i+1;
    const line = raw.trim();
    if (frontmatter) { if (i>0 && line==='---') frontmatter=false; continue; }
    const fence = line.match(/^(`{3,}|~{3,})/);
    if (fence) {
      if (!fenced) { fenced=true; fenceChar=fence[1][0]; }
      else if (fence[1][0] === fenceChar) { fenced=false; }
      continue;
    }
    if (fenced || /^>|^<!--|^<pre\b|^<\/pre>/i.test(line)) continue;
    if (selected && !selected.has(lineNo)) continue;
    // Preserve attributes where the content is in common component attributes.
    const attrs = [...raw.matchAll(/\b(?:lead|intro|label|summary|text|meta|alt|title)=["']([^"']+)["']/g)].map(x=>x[1]);
    let visible = raw
      .replace(/`[^`]*`/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\{%.*?%\}/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ');
    visible = [...attrs, visible].join(' ').trim();
    if (!visible) continue;
    for (const [id, message, pattern] of RULES) {
      if (enabled[id]===false) continue;
      const m = pattern.exec(visible);
      if (m) results.push({file, line:lineNo, rule:id, message, match:m[0]});
    }
    if (enabled['STYLE-06']!==false && (VAGUE_MD_LINK.test(raw) || VAGUE_HTML_LINK.test(raw) || /\blabel\s*=\s*['"](?:here|click here|learn more)['"]/i.test(raw)))
      results.push({file, line:lineNo, rule:'STYLE-06', message:'Use descriptive link text'});
    let heading = line.match(/^#{1,3}\s+(.+)$/)?.[1] ?? line.match(HEAD_HTML)?.[1]?.replace(/<[^>]*>/g,'').trim();
    if (heading && enabled['STYLE-07']!==false && GENERIC_HEADING.test(heading.trim()))
      results.push({file, line:lineNo, rule:'STYLE-07', message:'Heading should name the subject or finding', match:heading.trim()});
  }
  return results;
}

export function configAt(cwd, profile) {
  const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const localFile=path.join(cwd, '.editorial.json');
  const local=fs.existsSync(localFile) ? JSON.parse(fs.readFileSync(localFile,'utf8')) : {};
  const selected=profile ?? local.profile ?? 'default';
  if(!/^[a-z][a-z0-9-]*$/.test(selected)) throw new Error(`Invalid profile name: ${selected}`);
  const profileFile = path.join(here, 'profiles', `${selected}.json`);
  if (!fs.existsSync(profileFile)) throw new Error(`Unknown profile: ${selected}`);
  const builtIn=JSON.parse(fs.readFileSync(profileFile, 'utf8'));
  return {...builtIn, ...local, profile:selected, rules:{...builtIn.rules, ...local.rules}};
}

function ignored(rel, opts) {
  const parts=rel.split(path.sep);
  return parts.some(part=>(opts.exclude??[]).includes(part));
}
export function collectFiles(inputs, cwd, opts) {
  const collected = new Set();
  function walk(p) {
    const absolute=path.resolve(cwd,p);
    if (!fs.existsSync(absolute)) throw new Error(`Path not found: ${p}`);
    const rel=path.relative(cwd,absolute);
    if (ignored(rel,opts)) return;
    const stat=fs.statSync(absolute);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(absolute, {withFileTypes:true})) {
        if (!entry.isSymbolicLink()) walk(path.join(p,entry.name));
      }
    } else if (stat.isFile() && (opts.includeExtensions??[]).includes(path.extname(absolute))) collected.add(absolute);
  }
  for (const input of inputs) walk(input);
  return [...collected].sort();
}

export function changedLines(base, cwd) {
  const out=execFileSync('git',['diff','--no-ext-diff','--unified=0','--no-renames',base,'--'],{cwd,encoding:'utf8'});
  const selected=new Map();
  let file=null, next=null;
  for (const row of out.split('\n')) {
    if (row.startsWith('+++ b/')) { file=row.slice(6); selected.set(file,new Set()); continue; }
    if (row.startsWith('+++ /dev/null')) {file=null; continue;}
    if (row.startsWith('@@')) {const m=row.match(/\+(\d+)(?:,(\d+))?/);next=m?Number(m[1]):null;continue;}
    if (!file || next===null) continue;
    if (row.startsWith('+') && !row.startsWith('+++')) {selected.get(file).add(next);next++;}
    else if (row.startsWith(' ')) next++;
  }
  return selected;
}
