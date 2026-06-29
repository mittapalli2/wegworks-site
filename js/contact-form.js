/* WegWorks Contact Form — CAPTCHA + Google Apps Script submission */
(function() {
  'use strict';

  var captchaAnswer = 0;
  var FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwlulkLyPgt9g63HCyo6-2zEKCMfnpDt0oPLMzZ-fjHTz_l4dW2tA_vvLh5a9CTXxjG/exec';

  function generateCaptcha() {
    var el = document.getElementById('captcha-question');
    if (!el) return;

    var num1 = Math.floor(Math.random() * 10) + 1;
    var num2 = Math.floor(Math.random() * 10) + 1;
    var operators = ['+', '-', '×'];
    var operator = operators[Math.floor(Math.random() * 3)];
    var question = '';

    switch (operator) {
      case '+':
        captchaAnswer = num1 + num2;
        question = num1 + ' + ' + num2 + ' = ?';
        break;
      case '-':
        var larger = Math.max(num1, num2);
        var smaller = Math.min(num1, num2);
        captchaAnswer = larger - smaller;
        question = larger + ' - ' + smaller + ' = ?';
        break;
      case '×':
        captchaAnswer = num1 * num2;
        question = num1 + ' × ' + num2 + ' = ?';
        break;
    }

    el.textContent = question;
  }

  function collectFormData(form) {
    if (form.id === 'sb-contact-form') {
      var businessType = form.querySelector('#business-type');
      return {
        name: form.querySelector('#name').value,
        email: form.querySelector('#email').value,
        company: (form.querySelector('#business') && form.querySelector('#business').value) || 'Not provided',
        message: '[Small Business Page]\nBusiness Type: ' + (businessType ? businessType.value : 'Not selected') + '\n\n' + form.querySelector('#message').value
      };
    }

    var data = {
      name: form.querySelector('#name').value,
      email: form.querySelector('#email').value,
      company: (form.querySelector('#company') && form.querySelector('#company').value) || 'Not provided',
      message: form.querySelector('#message').value
    };

    var source = form.getAttribute('data-form-source');
    if (source) data.source = source;

    return data;
  }

  window.handleFormSubmit = async function(event) {
    event.preventDefault();

    var form = event.target;
    var submitBtn = form.querySelector('button[type="submit"]');
    var successDiv = document.getElementById('form-success');
    var originalBtnText = submitBtn.textContent;
    var userAnswer = parseInt(form.querySelector('#captcha').value, 10);

    if (userAnswer !== captchaAnswer) {
      alert('Incorrect answer. Please try the math question again.');
      generateCaptcha();
      form.querySelector('#captcha').value = '';
      form.querySelector('#captcha').focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      await fetch(FORM_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collectFormData(form))
      });

      form.style.display = 'none';
      successDiv.style.display = 'block';
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Something went wrong. Please try again or email us directly at info@wegworks.com');
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  };

  window.resetForm = function() {
    var form = document.getElementById('sb-contact-form') || document.querySelector('.contact-form');
    if (!form) return;

    var successDiv = document.getElementById('form-success');
    var submitBtn = form.querySelector('button[type="submit"]');
    var display = form.getAttribute('data-form-display') || 'block';

    form.reset();
    form.style.display = display;
    if (successDiv) successDiv.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message →';
    }
    generateCaptcha();
  };

  if (document.getElementById('captcha-question')) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', generateCaptcha);
    } else {
      generateCaptcha();
    }
  }
})();
