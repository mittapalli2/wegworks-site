/* WegWorks Small Business page — scroll reveal */
(function() {
  'use strict';

  var reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  function revealOnScroll() {
    var windowHeight = window.innerHeight;
    reveals.forEach(function(el) {
      if (el.getBoundingClientRect().top < windowHeight - 150) {
        el.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', revealOnScroll);
  window.addEventListener('load', revealOnScroll);
})();
