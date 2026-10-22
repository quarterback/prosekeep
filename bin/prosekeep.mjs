#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {lintSource,configAt,collectFiles,changedLines} from '../src/check.mjs';
import {standardsList,loadStandards} from '../src/standards.mjs';
import {headingOutline,checkSourceFidelity,reviewDocument,auditContent} from '../src/editorial.mjs';
const cwd=process.cwd();
const pkg=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
const cmd=args.shift()??'help';
const usage=`prosekeep 0.3.0
  prosekeep init [--profile default|vloora|public-service]
  prosekeep check [paths...] [--profile NAME] [--changed --base REF] [--json]
  prosekeep audit [paths...] [--profile NAME] [--json]
  prosekeep compare ORIGINAL REVISED [--json]
  prosekeep outline FILE [--json]
  prosekeep standards [ID] [--profile NAME] [--json]
  prosekeep review [FILE] [--profile NAME] [--json]
  prosekeep skill [--out DIR]
  prosekeep-mcp  # local MCP tools, prompts and policy resources

Deterministic warnings and review prompts cannot establish truth or editorial quality.`;
function value(flag,fallback){const idx=args.indexOf(flag);if(idx<0)return fallback;const v=args[idx+1];if(!v||v.startsWith('--'))throw new Error(`Missing value for ${flag}`);args.splice(idx,2);return v;}
function toggle(flag){const idx=args.indexOf(flag);if(idx<0)return false;args.splice(idx,1);return true;}
function copyDir(from,to){fs.mkdirSync(to,{recursive:true});for(const e of fs.readdirSync(from,{withFileTypes:true})){const s=path.join(from,e.name),d=path.join(to,e.name);if(e.isDirectory())copyDir(s,d);else fs.copyFileSync(s,d);}}
function output(result,json){if(json)console.log(JSON.stringify(result,null,2));else if(typeof result==='string')console.log(result);else console.log(JSON.stringify(result,null,2));}
function fileText(file){return fs.readFileSync(path.resolve(cwd,file),'utf8');}
async function main(){
 if(['help','--help','-h'].includes(cmd)){console.log(usage);return;}
 if(cmd==='init'){
  const profile=value('--profile',undefined),file=path.join(cwd,'.editorial.json');
  if(fs.existsSync(file))throw new Error('Already exists: .editorial.json (left unchanged)');
  const config=configAt(cwd,profile);fs.writeFileSync(file,JSON.stringify(config,null,2)+'\n');
  const manual=path.join(cwd,'EDITORIAL.md'),added=!fs.existsSync(manual);
  if(added)fs.copyFileSync(path.join(pkg,'templates/EDITORIAL.md'),manual);
  console.log(`Created .editorial.json (${config.profile})${added?' and EDITORIAL.md':''}. Edit them for your own register.`);return;
 }
 if(cmd==='skill'){
  const dest=value('--out','.agents/skills'),target=path.resolve(cwd,dest,'prosekeep');
  if(fs.existsSync(target))throw new Error(`Skill already exists: ${target}`);
  copyDir(path.join(pkg,'skills/prosekeep'),target);console.log(`Installed skill at ${target}`);return;
 }
 if(cmd==='standards'){
  const profile=value('--profile',undefined),json=toggle('--json'),opts=configAt(cwd,profile);
  if(args.length>1)throw new Error('Expected at most one standard ID');
  if(!args.length){output({selected:opts.standards,available:standardsList()},json);return;}
  const selected=args[0]==='all'?standardsList().map(x=>x.id):[args[0]];
  const data=loadStandards(selected);output(json?data:data.map(x=>x.guidance).join('\n\n'),json);return;
 }
 if(cmd==='compare'){
  const json=toggle('--json');if(args.length!==2)throw new Error('Usage: prosekeep compare ORIGINAL REVISED');
  const result=checkSourceFidelity(fileText(args[0]),fileText(args[1]));output(result,json);return;
 }
 if(cmd==='outline'){
  const json=toggle('--json');if(args.length!==1)throw new Error('Usage: prosekeep outline FILE');
  output(headingOutline(args[0],fileText(args[0])),json);return;
 }
 if(cmd==='review'){
  const profile=value('--profile',undefined),json=toggle('--json'),opts=configAt(cwd,profile);
  if(args.length>1)throw new Error('Expected at most one source file');
  if(!args.length){output(fs.readFileSync(path.join(pkg,'skills/prosekeep/references/review.md'),'utf8'),false);return;}
  output(reviewDocument(args[0],fileText(args[0]),opts),json);return;
 }
 if(cmd==='audit'){
  const profile=value('--profile',undefined),json=toggle('--json'),opts=configAt(cwd,profile);
  const candidates=collectFiles(args.length?args:['.'],cwd,opts);
  const documents=candidates.map(file=>({filename:path.relative(cwd,file).split(path.sep).join('/'),content:fs.readFileSync(file,'utf8')}));
  output(auditContent(documents,opts),json);return;
 }
 if(cmd==='check'){
  const profile=value('--profile',undefined),base=value('--base','HEAD~1'),changed=toggle('--changed'),json=toggle('--json'),opts=configAt(cwd,profile);
  const selection=changed?changedLines(base,cwd):null;
  const files=changed?[...selection.keys()]:args.length?args:['.'];
  const candidates=files.length?collectFiles(files.filter(f=>fs.existsSync(path.resolve(cwd,f))),cwd,opts):[];
  const findings=candidates.flatMap(file=>{const rel=path.relative(cwd,file).split(path.sep).join('/'),picked=selection?.get(rel);
   if(changed&&(!picked||!picked.size))return [];
   return lintSource(rel,fs.readFileSync(file,'utf8'),{rules:opts.rules,selectedLines:picked});});
  if(json)output({files:candidates.length,findings},true);
  else{for(const x of findings)console.log(`${x.file}:${x.line}: ${x.rule} ${x.message}${x.match?` (${JSON.stringify(x.match)})`:''}`);
    console.log(`${findings.length?'FAIL':'PASS'}: ${findings.length} mechanical findings in ${candidates.length} file(s). Editorial judgment still required.`);}
  if(findings.length)process.exitCode=1;return;
 }
 throw new Error(`Unknown command: ${cmd}\n${usage}`);
}
main().catch(e=>{console.error(e.message);process.exitCode=2;});
