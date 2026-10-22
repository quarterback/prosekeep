import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {headingOutline,checkSourceFidelity,reviewDocument,auditContent,applicableStandards} from '../src/editorial.mjs';
import {STANDARDS,loadStandards,standardsList} from '../src/standards.mjs';
import {configAt} from '../src/check.mjs';
import {handle} from '../src/mcp.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const opts=configAt(root,'vloora');
const run=(args,cwd=root)=>spawnSync(process.execPath,[path.join(root,'bin/prosekeep.mjs'),...args],{cwd,encoding:'utf8'});

test('seven sourced reference modules are present, readable and include original URLs',()=>{
 assert.equal(standardsList().length,7);
 for(const [id,entry] of Object.entries(STANDARDS)) {
  const item=loadStandards([id])[0];assert.match(item.guidance,/https:\/\//);assert.ok(item.guidance.length>500);assert.equal(item.source,entry.source);
 }
});
test('18F, plain language, GSA, accessibility, evidence and publishing references selected for Vloora',()=>{
 const ids=applicableStandards(opts).map(s=>s.id);
 for(const key of ['18f-content','federal-plain-language','gsa-content','accessible-content','source-evidence','ai-writing','publishing'])assert.ok(ids.includes(key));
});
test('a project can choose its own standards without editing the package',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'prosekeep-policy-'));
 try {fs.writeFileSync(path.join(temp,'.editorial.json'),JSON.stringify({profile:'default',standards:['accessible-content']}));const settings=configAt(temp);assert.deepEqual(settings.standards,['accessible-content']);assert.equal(applicableStandards(settings).length,1);}
 finally{fs.rmSync(temp,{recursive:true,force:true});}
});
test('unknown standards fail rather than silently disappear',()=>assert.throws(()=>loadStandards(['does-not-exist']),/Unknown standard/));
test('outline identifies section hierarchy, repetition and multiple first-level headings',()=>{
 const o=headingOutline('essay.md','# Title\n### Abrupt\n## Results\n## Results\n# Second title');
 assert.ok(o.findings.some(x=>x.rule==='STRUCT-01'));
 assert.ok(o.findings.some(x=>x.rule==='STRUCT-02'));
 assert.ok(o.findings.some(x=>x.rule==='STRUCT-03'));
});
test('outline ignores code blocks and Markdown metadata',()=>{
 const o=headingOutline('essay.md','---\ntitle: Test\n---\n# Title\n```md\n### Hidden\n```\n## Body');
 assert.deepEqual(o.headings.map(x=>x.text),['Title','Body']);
});
test('HTML images missing alt are reported, decorative empty alt accepted',()=>{
 const o=headingOutline('page.html','<h1>A page</h1>\n<img src="a.png">\n<img src="b.png" alt="">');
 assert.equal(o.findings.filter(x=>x.rule==='STRUCT-04').length,1);
});
test('source fidelity finds changed figures, URLs and numbered references',()=>{
 const original='Revenue was 20 percent [1]. See https://example.com/report';
 const revised='Revenue was 30 percent [2]. See https://example.com/new';
 const result=checkSourceFidelity(original,revised);
 assert.equal(result.changes.length,3);
 assert.ok(result.changes.find(x=>x.kind==='number or date').removed.includes('20'));
 assert.match(result.note,/not factual verification/);
});
test('source fidelity does not claim confirmation when no numeric tokens differ',()=>{
 const result=checkSourceFidelity('The permit was rejected.','The permit was approved.');
 assert.deepEqual(result.changes,[]);assert.equal(result.requiresHumanReview,true);
});
test('source fidelity rejects unexpected arguments',()=>assert.throws(()=>checkSourceFidelity(null,'a'),/strings/));
test('editorial preflight provides both findings and judgment tasks',()=>{
 const result=reviewDocument('draft.md','## Why it matters\nIn this essay, we delve into ideas.',opts);
 assert.ok(result.mechanical.language.length>=2);assert.ok(result.editorialReviewRequired.some(x=>/sources|original|evidence/i.test(x)));
 assert.match(result.note,/Mechanical checks/);
});
test('cross-page exact duplicate content is detected',()=>{
 const same='A specific paragraph describing requests and confirmations. It contains enough material to constitute repeated body content across the different sections of a website.';
 const r=auditContent([{filename:'a.md',content:same},{filename:'b.md',content:same}],opts);
 assert.equal(r.duplicates.length,1);assert.deepEqual(r.duplicates[0].files,['a.md','b.md']);
});
test('different paragraphs are not labeled duplicate',()=>{
 assert.equal(auditContent([{filename:'a.md',content:'One original text.'},{filename:'b.md',content:'Other writing.'}],opts).duplicates.length,0);
});
test('real example triggers the same STYLE checks as Vloora',()=>{
 const r=run(['check','examples/vloora/before.md','--profile','vloora']);
 assert.equal(r.status,1);assert.match(r.stdout,/STYLE-01/);assert.match(r.stdout,/STYLE-02/);assert.match(r.stdout,/STYLE-03/);assert.match(r.stdout,/STYLE-06/);
});
test('edited Vloora example passes the mechanical checker',()=>{
 const r=run(['check','examples/vloora/after.md','--profile','vloora']);assert.equal(r.status,0,r.stdout+r.stderr);
});
test('standards command can emit a sourced 18F module',()=>{
 const r=run(['standards','18f-content']);assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/18F content guide/);
});
test('outline CLI produces JSON',()=>{
 const r=run(['outline','examples/clean.md','--json']);assert.equal(r.status,0,r.stderr);assert.ok(Array.isArray(JSON.parse(r.stdout).headings));
});
test('compare CLI exposes preserved source tokens',()=>{
 const r=run(['compare','examples/vloora/before.md','examples/vloora/after.md','--json']);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).requiresHumanReview,true);
});
test('audit CLI enumerates checked documents',()=>{
 const r=run(['audit','examples/vloora','--json']);assert.equal(r.status,0,r.stderr);assert.ok(JSON.parse(r.stdout).documents.length>=2);
});
test('MCP exposes all nine review and reference tools',()=>{
 const tools=handle('tools/list').tools.map(x=>x.name);
 for(const name of ['check_text','check_file','review_document','review_page_structure','check_source_fidelity','audit_content','get_applicable_standards','get_project_policy','get_review_guide'])assert.ok(tools.includes(name));
});
test('MCP review_document is candid about semantic review',()=>{
 const r=handle('tools/call',{name:'review_document',arguments:{text:'In this essay we discuss results.',filename:'essay.md'}});
 assert.equal(r.isError,undefined);assert.match(r.structuredContent.note,/Mechanical checks/);
});
test('MCP get_applicable_standards yields full 18F module and source',()=>{
 const r=handle('tools/call',{name:'get_applicable_standards',arguments:{ids:['18f-content']}});
 assert.match(r.structuredContent.selected[0].guidance,/18F Content Guide/);assert.match(r.structuredContent.selected[0].source,/guides\.18f\.org/);
});
test('MCP rejects unrecognized reference ID',()=>{
 const r=handle('tools/call',{name:'get_applicable_standards',arguments:{ids:['imaginary']}});assert.equal(r.isError,true);
});
test('MCP fidelity compare flags changed figures',()=>{
 const r=handle('tools/call',{name:'check_source_fidelity',arguments:{original:'Cost 50',revised:'Cost 60'}});
 assert.equal(r.structuredContent.changes[0].kind,'number or date');
});
test('MCP audit_content validates document input',()=>{
 const r=handle('tools/call',{name:'audit_content',arguments:{documents:'not-an-array'}});assert.equal(r.isError,true);
});
test('MCP exposes standards as read-only resources',()=>{
 const r=handle('resources/read',{uri:'prosekeep://standards'});
 assert.match(r.contents[0].text,/18F content and voice/);
});
