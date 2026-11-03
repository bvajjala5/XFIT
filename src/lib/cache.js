export async function clearAppCaches() {
  try {
    if (!('caches' in window)) return;
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  } catch (error) {
    console.warn('Could not clear app cache:', error);
  }
}
