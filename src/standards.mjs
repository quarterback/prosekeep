import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const STANDARDS = Object.freeze({
  '18f-content': {title:'18F content and voice', file:'18f-content.md', source:'https://guides.18f.org/content-guide/', scope:'recommended editorial guidance'},
  'federal-plain-language': {title:'Federal plain-language principles', file:'federal-plain-language.md', source:'https://digital.gov/guides/plain-language', scope:'recommended editorial guidance'},
  'gsa-content': {title:'GSA web content standards', file:'gsa-content.md', source:'https://www.gsa.gov/reference/gsa-web-style-guide/content-standards', scope:'reference; agency-specific requirements only for applicable organizations'},
  'accessible-content': {title:'Accessible web content', file:'accessible-content.md', source:'https://designsystem.digital.gov/design-principles/', scope:'accessibility guidance and test prompts'},
  'source-evidence': {title:'Evidence, citation and factual fidelity', file:'source-evidence.md', source:'https://guides.18f.org/content-guide/', scope:'Prosekeep editorial method'},
  'ai-writing': {title:'AI-generated prose review', file:'ai-writing.md', source:'https://github.com/blader/humanizer', scope:'Prosekeep adapted review criteria; humanizer is a separate upstream skill'},
  'publishing': {title:'Content model and publishing checks', file:'publishing.md', source:'https://www.gsa.gov/reference/gsa-web-style-guide/content-standards', scope:'Prosekeep editorial method'}
});
const BASE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../skills/prosekeep/references/standards');
export function standardsList() { return Object.entries(STANDARDS).map(([id, s])=>({id, title:s.title, source:s.source, scope:s.scope})); }
export function loadStandards(ids) {
  if (!Array.isArray(ids)) throw new Error('standards must be an array');
  return ids.map(id => {
    const s=STANDARDS[id];
    if (!s) throw new Error(`Unknown standard: ${id}`);
    return {id, title:s.title, source:s.source, scope:s.scope, guidance:fs.readFileSync(path.join(BASE,s.file),'utf8')};
  });
}
