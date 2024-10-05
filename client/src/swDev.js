function swDev() {
  let swUrl = `${process.env.PUBLIC_URL}/sw.js`;

  navigator.serviceWorker.register(swUrl).then((response) => {});
}

export default swDev;
