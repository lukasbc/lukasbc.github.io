document.addEventListener('DOMContentLoaded', () => {
    const swiper = new Swiper('.swiper', {
      loop: true,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
      },
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
    });
  });

function jouerSon(type) {
      const son = document.getElementById(type);
      if (son) {
        son.currentTime = 0;
        son.play();
      }
}

function jouerSonFinished() {
    const sons = [
      document.getElementById("finish1"),
      document.getElementById("finish2"),
      document.getElementById("finish3"),
      document.getElementById("finish4")
    ];
    const randomIndex = Math.floor(Math.random() * sons.length);
    const son = sons[randomIndex];
    son.currentTime = 0;
    son.play();
  }

function jouerSonEat() {
    const sons = [
      document.getElementById("eat1"),
      document.getElementById("eat2")
    ];
    const randomIndex = Math.floor(Math.random() * sons.length);
    const son = sons[randomIndex];
    son.currentTime = 0;
    son.play();
  }