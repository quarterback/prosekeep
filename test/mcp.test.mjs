import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {dispatch,handle} from '../src/mcp.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const request=(id,method,params={})=>({jsonrpc:'2.0',id,method,params});

test('handshake and discover MCP capabilities',()=>{
 const res=dispatch(request(1,'initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'test',version:'1.0.0'}}));
 assert.equal(res.result.serverInfo.name,'prosekeep');
 assert.equal(res.result.protocolVersion,'2025-11-25');
 assert.ok(handle('tools/list').tools.find(x=>x.name==='check_text'));
 assert.ok(handle('prompts/list').prompts.find(x=>x.name==='editorial_review'));
 assert.ok(handle('resources/list').resources.find(x=>x.uri==='prosekeep://review-guide'));
});
test('MCP check_text returns findings and no semantic claims',()=>{
 const res=dispatch(request(4,'tools/call',{name:'check_text',arguments:{text:'In this essay, we delve into the topic.',filename:'essay.md'}}));
 assert.equal(res.result.structuredContent.count,2);
 assert.equal(res.result.isError,undefined);
 assert.match(res.result.structuredContent.note,/cannot establish facts/);
});
test('MCP supports optional project profile and error reporting',()=>{
 const alt=handle('tools/call',{name:'check_text',arguments:{text:'A score—recorded.',profile:'vloora'}});
 assert.ok(alt.structuredContent.findings.find(x=>x.rule==='STYLE-04'));
 const bad=handle('tools/call',{name:'check_file',arguments:{path:'../../etc/passwd'}});
 assert.equal(bad.isError,true);
});
test('MCP read-only guide and prompt',()=>{
 const guide=handle('resources/read',{uri:'prosekeep://review-guide'});
 assert.match(guide.contents[0].text,/Editorial review checklist/);
 const p=handle('prompts/get',{name:'editorial_review',arguments:{text:'A draft.'}});
 assert.match(p.messages[0].content.text,/A draft/);
 assert.match(p.messages[0].content.text,/Preserve authorial decisions/);
});
test('MCP stdio exchanges newline-delimited JSON-RPC responses',()=>{
 const inputs=[
  request(1,'initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'test',version:'1'}}),
  {jsonrpc:'2.0',method:'notifications/initialized'},
  request(2,'tools/list'),
  request(3,'tools/call',{name:'check_text',arguments:{text:'In this article, we explore a powerful tool.'}})
 ];
 const run=spawnSync(process.execPath,[path.join(root,'bin/prosekeep-mcp.mjs')],{input:inputs.map(x=>JSON.stringify(x)).join('\n')+'\n',encoding:'utf8',timeout:5000});
 assert.equal(run.status,0,run.stderr);
 const responses=run.stdout.trim().split('\n').map(JSON.parse);
 assert.deepEqual(responses.map(x=>x.id),[1,2,3]);
 assert.equal(responses[2].result.structuredContent.findings[0].rule,'STYLE-02');
});
test('outside-workspace symlinks cannot be read',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'prosekeep-test-'));
 try {
  fs.symlinkSync('/etc/passwd',path.join(temp,'outside.md'));
  const run=spawnSync(process.execPath,[path.join(root,'bin/prosekeep-mcp.mjs')],{input:JSON.stringify(request(2,'tools/call',{name:'check_file',arguments:{path:'outside.md'}}))+'\n',cwd:temp,encoding:'utf8',timeout:5000});
  assert.equal(run.status,0,run.stderr);
  assert.equal(JSON.parse(run.stdout).result.isError,true);
 } finally {fs.rmSync(temp,{recursive:true,force:true});}
});


test('MCP policy cannot read symlinks outside working project',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'prosekeep-policy-'));
 try {
  fs.symlinkSync('/etc/passwd',path.join(temp,'EDITORIAL.md'));
  const run=spawnSync(process.execPath,[path.join(root,'bin/prosekeep-mcp.mjs')],{input:JSON.stringify(request(2,'tools/call',{name:'get_project_policy',arguments:{}}))+'\n',cwd:temp,encoding:'utf8',timeout:5000});
  assert.equal(run.status,0,run.stderr);
  const message=JSON.parse(run.stdout);
  assert.equal(message.result.isError,true);
  assert.match(message.result.content[0].text,/inside the current project/);
 } finally {fs.rmSync(temp,{recursive:true,force:true});}
});
