/* WegWorks FAQ accordion */
(function() {
  'use strict';

  document.addEventListener('click', function(e) {
    var question = e.target.closest('.faq-question');
    if (question) {
      question.parentElement.classList.toggle('active');
    }
  });
})();
