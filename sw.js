/* 相簿工房 離線支援 service worker（network-first，斷網用 cache；字體都會 cache 埋） */
var CACHE='album-kobo-v1';
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(['./','./index.html']); })
      .then(function(){ return self.skipWaiting(); })
  );
});
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){ return k!==CACHE && k.indexOf('album-kobo')===0; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function(e){
  if(e.request.method!=='GET') return;
  var url=e.request.url;
  if(url.indexOf('generativelanguage.googleapis.com')>=0||url.indexOf('api.openai.com')>=0||url.indexOf('api.anthropic.com')>=0) return;
  e.respondWith(
    fetch(e.request).then(function(resp){
      if(resp && (resp.ok || resp.type==='opaque')){
        var copy=resp.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
      }
      return resp;
    }).catch(function(){
      return caches.match(e.request, {ignoreSearch:true}).then(function(r){
        return r || (e.request.mode==='navigate' ? caches.match('./index.html') : undefined);
      });
    })
  );
});
