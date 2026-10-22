import {lintSource} from './check.mjs';
import {loadStandards} from './standards.mjs';

const skipCode = text => text.replace(/^(?:```|~~~)[\s\S]*?^(?:```|~~~)[^\n]*$/gm, '');
export function headingOutline(filename, content) {
  const lines = content.split(/\r?\n/);
  const headings=[]; const findings=[];
  let fenced=false; let frontMatter=/\.mdx?$/.test(filename)&&lines[0]?.trim()==='---';
  for (let i=0;i<lines.length;i++) {
    const line=lines[i].trim();
    if(frontMatter){if(i>0&&line==='---')frontMatter=false;continue;}
    if (/^(`{3,}|~{3,})/.test(line)){fenced=!fenced;continue;}
    if(fenced)continue;
    const md=line.match(/^(#{1,6})\s+(.+)$/);
    const html=line.match(/<h([1-6])\b[^>]*>(.*?)<\/h\1>/i);
    if(md || html) {
      const level=md?md[1].length:Number(html[1]);
      const heading=(md?md[2]:html[2].replace(/<[^>]+>/g,'')).trim();
      headings.push({line:i+1,level,text:heading});
    }
    if (/\.html?$/.test(filename)) {
      for(const img of line.matchAll(/<img\b[^>]*>/gi)) {
        if(!/\balt\s*=/.test(img[0]))findings.push({rule:'STRUCT-04',line:i+1,message:'Image has no alt attribute; inspect whether it is informative or decorative'});
      }
    }
  }
  const normalized=new Map();let previous=0;let titles=0;
  for(const h of headings) {
    if(h.level===1)titles++;
    if(previous && h.level>previous+1)findings.push({rule:'STRUCT-01',line:h.line,message:`Heading jumps from H${previous} to H${h.level}; inspect the hierarchy`});
    const key=h.text.toLowerCase();if(normalized.has(key))findings.push({rule:'STRUCT-02',line:h.line,message:`Repeated heading: ${h.text}`});
    normalized.set(key,h.line);previous=h.level;
  }
  if(titles>1)findings.push({rule:'STRUCT-03',line:null,message:'More than one H1; verify the document hierarchy'});
  return {headings,findings,note:'Heading hierarchy checks are advisory and do not establish whether labels accurately describe their sections.'};
}

const urls = s=>[...new Set((s.match(/https?:\/\/[^\s<>)\]"']+/g)??[]).map(u=>u.replace(/[.,;]+$/,'')))];
const figures = s=>[...new Set((s.match(/(?<![\w/])(?:\$?\d[\d,.]*%?|\b\d{4}-\d{2}-\d{2}\b)(?![\w/])/g)??[]))];
const citations = s => [...new Set((s.match(/\[[0-9]+(?:[\s,–-]+[0-9]+)*\]/g)??[]))];
function delta(a,b){return a.filter(x=>!b.includes(x));}
export function checkSourceFidelity(original, revised) {
  if(typeof original!=='string'||typeof revised!=='string')throw new Error('original and revised must be strings');
  const dimensions = [
    ['URL',urls],['number or date',figures],['numbered citation',citations]
  ];
  const changes=dimensions.map(([kind, fn])=>{
    const before=fn(original),after=fn(revised);
    return {kind, removed:delta(before,after), added:delta(after,before)};
  }).filter(x=>x.removed.length||x.added.length);
  return {requiresHumanReview:true, changes, prompts:[
    'Compare every factual claim, named entity, qualification, quotation, chronology and cited source with the original.',
    'Confirm each numerical or URL change against an original source before approving it.',
    'A matching number or link does not prove the surrounding statement is true.'
  ], note:'This is a token-level comparison, not factual verification. Numeric tokens inside URLs or code may also be reported.'};
}

export function reviewDocument(filename, content, config) {
  if(typeof content!=='string')throw new Error('content must be a string');
  const language=lintSource(filename,content,{rules:config.rules});
  const structure=headingOutline(filename,content);
  return {filename,profile:config.profile,mechanical:{language,structure:structure.findings},outline:structure.headings,
    standards:(config.standards??[]).map(id=>({id})),
    editorialReviewRequired:[
      'Identify the reader, the job of this page, and the approved author or brand voice.',
      'Read the headings as an outline and compare each heading with the section below it.',
      'Check whether the first paragraph delivers the relevant information.',
      'Preserve original assertions, facts, dates, URLs, citations, deliberate uncertainty, and personal register.',
      'Review repeated propositions across other pages and remove unsupported or duplicated claims.',
      'Check source status: proposed, attempted, acknowledged, reported completed, or independently verified.',
      'Check links, meaningful alt text, captions, semantic table headers, accessibility and publishing metadata.',
      'Record decisions that need the owner; do not silently change positioning or product claims.'
    ],note:'Mechanical checks and prompts only. A human or instructed agent must perform semantic and source review.'};
}

export function auditContent(documents,config) {
  if(!Array.isArray(documents)||documents.some(x=>!x||typeof x.filename!=='string'||typeof x.content!=='string'))throw new Error('documents must be {filename,content} objects');
  const docs=documents.map(d=>reviewDocument(d.filename,d.content,config));
  const previous=new Map(),duplicates=[];
  for (const d of documents) {
    const blocks=d.content.replace(/```[\s\S]*?```/g,'').split(/\n\s*\n/);
    for(const block of blocks){
      const normalized=block.replace(/\s+/g,' ').trim().toLowerCase();
      if(normalized.length<95||normalized.startsWith('#')||normalized.startsWith('<!--'))continue;
      if(previous.has(normalized)&&previous.get(normalized)!==d.filename)duplicates.push({files:[previous.get(normalized),d.filename],excerpt:normalized.slice(0,140)});
      else previous.set(normalized,d.filename);
    }
  }
  return {documents:docs,duplicates,note:'Exact normalized duplicates only; semantic duplication and page-role problems require review.'};
}

export function applicableStandards(config,ids) {return loadStandards(ids?.length?ids:(config.standards??[]));}
