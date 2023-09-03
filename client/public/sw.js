// let staticCache = "static-v3";
// let dynamicCache = "dynamic-v2";

// // this.addEventListener("install", (event) => {
// //   event.waitUntil(
// //     caches.open(staticCache).then((cache) => {
// //       cache.addAll(["/login", "static/js/bundle.js"]);
// //     })
// //   );
// // });

// this.addEventListener("fetch", (event) => {
//   event.respondWith(
//     fetch(event.request)
//       .then((res) => {
//         return caches.open(dynamicCache).then((cache) => {
//           cache.put(event.request.url, res.clone());
//           return res;
//         });
//       })
//       .catch(() => {
//         return caches.match(event.request);
//       })
//   );
// });
