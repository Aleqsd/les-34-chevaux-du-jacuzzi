import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const origin=process.argv[2]||'http://127.0.0.1:5173';
if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw new Error('This fixture test only runs against loopback.');
const checks=[]; const author='Test API';
async function read(path){const response=await fetch(origin+path);assert.equal(response.status,200);return response.json();}
async function post(body,expected=201){const response=await fetch(origin+'/api/club',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});const data=await response.json();assert.equal(response.status,expected,JSON.stringify(data));return data;}
const movieSearch=await read('/api/movies?q=Le%20D%C3%AEner%20de%20cons');
assert(movieSearch.movies.some(m=>m.id==='9421'));assert(!JSON.stringify(movieSearch).includes('overview'));checks.push('French movie search with no synopsis');
const detail=await read('/api/movies?id=9421');assert.equal(detail.movie.runtime,80);assert.equal(detail.movie.director,'Francis Veber');checks.push('Movie metadata detail');
const film=await post({action:'propose',kind:'movie',title:detail.movie.title,author,movie:detail.movie});
assert.equal(film.proposal.id,film.id);assert.equal(film.proposal.movie.id,'9421');assert.equal(film.proposal.author,author);
const movieVote={action:'vote',id:crypto.randomUUID(),proposalId:film.id,author,value:1};
await post(movieVote);await post({...movieVote,id:crypto.randomUUID()});await post({...movieVote,id:crypto.randomUUID(),value:-1});
const movieState=await read('/api/club');assert.equal(movieState.proposals.find(p=>p.id===film.id).movie.id,'9421');
assert.equal(movieState.votes.filter(v=>v.proposalId===film.id&&v.author===author&&v.value===1).length,2);
assert.equal(movieState.votes.filter(v=>v.proposalId===film.id&&v.author===author&&v.value===-1).length,1);
checks.push('Movie creation returns confirmed persisted proposal; named for/against votes preserve repeated counts');
const activity=await post({action:'propose',kind:'activity',title:'TEST API — activité',url:'https://example.com/activite',author,start:'2026-09-24T14:00:00+02:00',end:'2026-09-24T16:00:00+02:00'});
await post({action:'propose',kind:'activity',title:'Invalid URL',url:'javascript:alert(1)',author,start:'2026-09-24T14:00:00+02:00',end:'2026-09-24T16:00:00+02:00'},400);
await post({action:'propose',kind:'activity',title:'Invalid dates',url:'https://example.com',author,start:'2026-09-28T14:00:00+02:00',end:'2026-09-28T16:00:00+02:00'},400);
await post({action:'propose',kind:'activity',title:'Invalid end',url:'https://example.com',author,start:'2026-09-24T14:00:00+02:00',end:'2026-09-24T12:00:00+02:00'},400);checks.push('Activity creation and server URL/date validation');
const vote={action:'vote',id:crypto.randomUUID(),proposalId:activity.id,author,value:1};
await post(vote);await post(vote);await post({...vote,id:crypto.randomUUID()});await post({...vote,id:crypto.randomUUID(),value:-1});
const slot=await post({action:'slot',proposalId:activity.id,author,start:'2026-09-25T17:00:00+02:00',end:'2026-09-25T19:00:00+02:00'});
await post({action:'vote',id:crypto.randomUUID(),slotId:slot.id,author,value:1});
await post({action:'vote',id:crypto.randomUUID(),proposalId:crypto.randomUUID(),author,value:1},400);
const state=await read('/api/club');
assert.equal(state.votes.filter(v=>v.proposalId===activity.id&&v.value===1).length,2);
assert.equal(state.votes.filter(v=>v.proposalId===activity.id&&v.value===-1).length,1);
assert.equal(state.votes.filter(v=>v.slotId===slot.id).length,1);
assert.equal(state.proposals.find(p=>p.id===activity.id).start,'2026-09-24T14:00:00+02:00');
checks.push('Same-name repeat votes, idempotent request retries, separate alternative-slot votes, original slot preserved, independent client readback');
const denied=await fetch(origin+'/api/club',{method:'POST',headers:{Origin:'https://example.net','Content-Type':'application/json'},body:JSON.stringify(vote)});assert.equal(denied.status,403);checks.push('Cross-origin writes rejected');
const timing=[];for(let i=0;i<3;i++){const start=performance.now();await read('/api/movies?q=Le%20D%C3%AEner%20de%20cons');timing.push(Math.round(performance.now()-start));}
const report={passed:true,checkedAt:new Date().toISOString(),checks,warmMovieSearchMs:timing,localFixtureAuthor:author};
writeFileSync('.sites-runtime/api-validation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
