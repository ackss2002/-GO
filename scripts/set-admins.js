// Usage: node set-admins.js /path/to/serviceAccountKey.json UID1 UID2 ...
// This script sets /admins/{uid} = true in the project's Realtime Database.
// Requires: npm install firebase-admin

const admin = require('firebase-admin');
const path = require('path');

async function main(){
  const args = process.argv.slice(2);
  if(args.length < 2){
    console.error('Usage: node set-admins.js /path/to/serviceAccountKey.json UID1 UID2 ...');
    process.exit(1);
  }
  const keyPath = path.resolve(args[0]);
  const uids = args.slice(1);
  let serviceAccount;
  try{ serviceAccount = require(keyPath); }catch(e){ console.error('Cannot load service account key:', e.message); process.exit(1); }

  const DATABASE_URL = 'https://ttgo-league-default-rtdb.firebaseio.com';
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount), databaseURL: DATABASE_URL });
  const db = admin.database();
  const updates = {};
  uids.forEach(uid=>{ updates[uid] = true; });
  try{
    await db.ref('admins').update(updates);
    console.log('Admins set:', uids.join(', '));
    process.exit(0);
  }catch(e){ console.error('Failed to set admins:', e); process.exit(1); }
}

main();
