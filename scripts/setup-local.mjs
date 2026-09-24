import {existsSync,mkdirSync,writeFileSync,copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
mkdirSync('.openai',{recursive:true});mkdirSync('.sites-runtime',{recursive:true});
if(!existsSync('.openai/hosting.json'))writeFileSync('.openai/hosting.json',JSON.stringify({d1:'DB',r2:null},null,2)+'\n');
if(!existsSync('.sites-runtime/execution-profile.json'))writeFileSync('.sites-runtime/execution-profile.json',JSON.stringify({executionProfile:'portable'})+'\n');
if(!existsSync('.env'))copyFileSync('.env.example','.env');
console.log('Configuration locale prête. Renseigne ta propre clé TMDB dans .env. Aucun accès de production n’a été créé.');
