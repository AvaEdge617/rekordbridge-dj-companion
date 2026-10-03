let database;
function open() {
  return database ||= new Promise((resolve, reject) => {
    const request = indexedDB.open('cuecraft-audio', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function storeFile(id, file) {
  const db = await open();
  return new Promise((resolve, reject) => { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').put(file, id); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
}
export async function readFile(id) {
  const db = await open();
  return new Promise((resolve, reject) => { const request = db.transaction('files').objectStore('files').get(id); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
}
export async function removeFile(id) { const db = await open(); db.transaction('files', 'readwrite').objectStore('files').delete(id); }
export async function listIds() { const db = await open(); return new Promise((resolve, reject) => { const request = db.transaction('files').objectStore('files').getAllKeys(); request.onsuccess = () => resolve(request.result.map(String)); request.onerror = () => reject(request.error); }); }
