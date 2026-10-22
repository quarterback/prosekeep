#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintSource,configAt,collectFiles,changedLines } from '../src/check.mjs';
const cwd=process.cwd();
const pkg=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const cmd=args.shift() ?? 'help';
const usage=`prosekeep 0.2.0
  prosekeep init [--profile default|vloora]
  prosekeep check [paths...] [--profile default|vloora] [--changed --base REF] [--json]
  prosekeep review
  prosekeep-mcp  # local MCP server for AI agents
  prosekeep skill [--out DIR]

Rules STYLE-01..07 check mechanical patterns, not factual accuracy, prose quality, or authorial intent.`;
function value(flag, fallback) {const idx=args.indexOf(flag);if(idx<0) return fallback;const v=args[idx+1];if(!v || v.startsWith('--')) throw new Error(`Missing value for ${flag}`);args.splice(idx,2);return v;}
function toggle(flag) {const idx=args.indexOf(flag); if(idx<0) return false;args.splice(idx,1);return true;}
function copyDir(from,to) {fs.mkdirSync(to,{recursive:true}); for(const e of fs.readdirSync(from,{withFileTypes:true})) {const s=path.join(from,e.name),d=path.join(to,e.name);if(e.isDirectory()) copyDir(s,d);else fs.copyFileSync(s,d);}}
async function main() {
 if(cmd==='help' || cmd==='--help' || cmd==='-h') {console.log(usage);return;}
 if(cmd==='init') {
  const profile=value('--profile',undefined);
  const file=path.join(cwd,'.editorial.json');
  if(fs.existsSync(file)) throw new Error('Already exists: .editorial.json (left unchanged)');
  const config=configAt(cwd,profile);
  config.profile=profile ?? config.profile;
  fs.writeFileSync(file,JSON.stringify(config,null,2)+'\n');
  const manual=path.join(cwd,'EDITORIAL.md');
  if(!fs.existsSync(manual)) fs.copyFileSync(path.join(pkg,'templates/EDITORIAL.md'),manual);
  console.log(`Created .editorial.json (${config.profile})${fs.existsSync(manual)?' and prepared EDITORIAL.md':''}. Edit them for your own register.`);return;
 }
 if(cmd==='review') {
  console.log(fs.readFileSync(path.join(pkg,'skills/prosekeep/references/review.md'),'utf8'));return;
 }
 if(cmd==='skill') {
  const dest=value('--out', '.agents/skills');
  const target=path.resolve(cwd,dest,'prosekeep');
  if(fs.existsSync(target)) throw new Error(`Skill already exists: ${target}`);
  copyDir(path.join(pkg,'skills/prosekeep'),target);
  console.log(`Installed skill at ${target}`);return;
 }
 if(cmd==='check') {
  const profile=value('--profile',undefined);
  const base=value('--base','HEAD~1');
  const changed=toggle('--changed');
  const json=toggle('--json');
  const opts=configAt(cwd,profile);
  const selection=changed ? changedLines(base,cwd) : null;
  const files=changed ? [...selection.keys()] : args.length?args:['.'];
  const candidates=files.length?collectFiles(files.filter(f=>fs.existsSync(path.resolve(cwd,f))),cwd,opts):[];
  const findings=candidates.flatMap(file=> {
    const rel=path.relative(cwd,file).split(path.sep).join('/');
    const picked=selection?.get(rel);
    if(changed && (!picked || !picked.size)) return [];
    return lintSource(rel,fs.readFileSync(file,'utf8'),{rules:opts.rules,selectedLines:picked});
  });
  if(json) console.log(JSON.stringify({files:candidates.length,findings},null,2));
  else {for(const x of findings) console.log(`${x.file}:${x.line}: ${x.rule} ${x.message}${x.match?` (${JSON.stringify(x.match)})`:''}`);console.log(`${findings.length?'FAIL':'PASS'}: ${findings.length} mechanical findings in ${candidates.length} file(s). Editorial judgment still required.`);}
  if(findings.length) process.exitCode=1;
  return;
 }
 throw new Error(`Unknown command: ${cmd}\n${usage}`);
}
main().catch(e=>{console.error(e.message);process.exitCode=2;});
