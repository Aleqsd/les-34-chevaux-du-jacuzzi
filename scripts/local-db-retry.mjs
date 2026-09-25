// Wrangler and the local preview briefly contend for the same SQLite file.
// Retry only a busy database; all other failures must remain test failures.
export function retryLocalDb(run){
 for(let attempt=0;;attempt++){
  const result=run();
  if(result.status===0||attempt>=5||!/SQLITE_BUSY|database is locked/.test((result.stderr||'')+(result.stdout||'')))return result;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,150*(attempt+1));
 }
}
