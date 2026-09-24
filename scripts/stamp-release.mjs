import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const {version}=JSON.parse(await fs.readFile(new URL('package.json',root),'utf8'));
await fs.writeFile(new URL('lib/site-release.json',root),JSON.stringify({version,updatedAt:new Date().toISOString()},null,2)+'\n');
console.log('Release metadata: v'+version);
