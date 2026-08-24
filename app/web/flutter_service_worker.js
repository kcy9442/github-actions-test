// 이전 Flutter PWA 배포가 설치한 서비스 워커를 안전하게 해제한다.
// OAuth 설정은 빌드마다 달라질 수 있으므로 오래된 main.dart.js를 계속 제공하면
// 사용자가 삭제된 Cognito Hosted UI 도메인으로 이동하게 된다.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration.unregister().then(() => self.clients.matchAll({ type: 'window' }))
  );
});
