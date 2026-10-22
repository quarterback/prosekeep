import test from 'node:test';
import assert from 'node:assert/strict';
import { lintSource, changedLines, collectFiles, configAt } from '../src/check.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const issues=(text,file='test.md',options={})=>lintSource(file,text,options).map(x=>x.rule);
test('clean technical prose passes',()=>assert.deepEqual(issues('The server checks the request before sending it.'),[]));
test('stock vocabulary',()=>assert.ok(issues('The work will unlock many opportunities.').includes('STYLE-01')));
test('staged intro',()=>assert.ok(issues('In this essay, we explore events.').includes('STYLE-02')));
test('negative contrast',()=>assert.ok(issues('It is not just a record but a revolution.').includes('STYLE-03')));
test('prose em dash',()=>assert.ok(issues('The event started—without warning.').includes('STYLE-04')));
test('numeric range en dash is accepted',()=>assert.ok(!issues('During 2024–2026 the system grew.').includes('STYLE-04')));
test('day first date',()=>assert.ok(issues('It happened 17 October 2026.').includes('STYLE-05')));
test('vague Markdown links',()=>assert.ok(issues('[Learn more](https://example.org)').includes('STYLE-06')));
test('vague HTML links',()=>assert.ok(issues('<a href="/blog/">Click here</a>','post.html').includes('STYLE-06')));
test('generic headings',()=>assert.ok(issues('## Why it matters').includes('STYLE-07')));
test('frontmatter and code fences ignored',()=>assert.deepEqual(issues('---\ntitle: Why it matters\n---\n```\nIn this essay\n```\nActual text.'),[]));
test('quoted examples ignored',()=>assert.deepEqual(issues('> In this essay, we delve into things.'),[]));
test('only changed lines checked',()=>assert.deepEqual(issues('In this essay, we explore.\nA useful plain sentence.','post.md',{selectedLines:[2]}),[]));
test('rule can be disabled',()=>assert.deepEqual(issues('It will unlock something.','post.md',{rules:{'STYLE-01':false}}),[]));
test('recursive file collection excludes node_modules',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'editorial-'));
 try {fs.writeFileSync(path.join(dir,'a.md'),'Plain');fs.mkdirSync(path.join(dir,'node_modules'));fs.writeFileSync(path.join(dir,'node_modules','bad.md'),'Bad');
 const found=collectFiles(['.'],dir,configAt(dir));assert.equal(found.length,1);}
 finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('git diff maps added lines',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'editorial-git-'));
 const git=(...a)=>execFileSync('git',a,{cwd:dir,encoding:'utf8'});
 try {git('init','-q');git('config','user.email','test@example.invalid');git('config','user.name','Test');fs.writeFileSync(path.join(dir,'a.md'),'Old text.\n');git('add','.');git('commit','-qm','initial');
 fs.writeFileSync(path.join(dir,'a.md'),'Old text.\nIn this essay we look closer.\n');git('add','.');git('commit','-qm','change');
 assert.deepEqual([...changedLines('HEAD~1',dir).get('a.md')],[2]);}
 finally {fs.rmSync(dir,{recursive:true,force:true});}
});
