/* ==========================================================================
   WegWorks Common JavaScript
   Shared functionality for all pages
   ========================================================================== */

(function() {
  'use strict';

  // ==========================================================================
  // Mobile Menu Toggle
  // ==========================================================================
  
  function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener('click', function() {
        const isActive = mobileMenu.classList.toggle('active');
        mobileToggle.textContent = isActive ? '✕' : '☰';
        mobileToggle.setAttribute('aria-expanded', isActive);
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = isActive ? 'hidden' : '';
      });
      
      // Close menu when clicking a link
      mobileMenu.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
          mobileMenu.classList.remove('active');
          mobileToggle.textContent = '☰';
          mobileToggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        });
      });
      
      // Close menu on escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
          mobileMenu.classList.remove('active');
          mobileToggle.textContent = '☰';
          mobileToggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });
    }
  }

  // ==========================================================================
  // Header Scroll Effect
  // ==========================================================================
  
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    
    if (header && !header.classList.contains('header-solid')) {
      let lastScroll = 0;
      
      window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
      }, { passive: true });
    }
  }

  // ==========================================================================
  // Smooth Scroll for Anchor Links
  // ==========================================================================
  
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // ==========================================================================
  // Lazy Load Images
  // ==========================================================================
  
  function initLazyLoad() {
    if ('loading' in HTMLImageElement.prototype) {
      // Browser supports native lazy loading
      document.querySelectorAll('img[data-src]').forEach(function(img) {
        img.src = img.dataset.src;
      });
    } else {
      // Fallback for older browsers
      const lazyImages = document.querySelectorAll('img[data-src]');
      
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.dataset.src;
              imageObserver.unobserve(img);
            }
          });
        });
        
        lazyImages.forEach(function(img) {
          imageObserver.observe(img);
        });
      }
    }
  }

  // ==========================================================================
  // Theme Toggle (Dark / Light)
  // ==========================================================================

  function initThemeToggle() {
    var STORAGE_KEY = 'ww-theme';

    // Determine the initial theme:
    // 1. User's saved preference  2. OS preference  3. Default dark
    function getInitialTheme() {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
      return 'dark';
    }

    function applyTheme(theme) {
      if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }

    function buildToggleButton() {
      var btn = document.createElement('button');
      btn.className = 'theme-toggle';
      btn.setAttribute('aria-label', 'Toggle dark/light mode');
      btn.setAttribute('title', 'Toggle dark/light mode');
      btn.innerHTML =
        '<svg class="icon-moon" viewBox="0 0 24 24">' +
          '<path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>' +
        '</svg>' +
        '<svg class="icon-sun" viewBox="0 0 24 24">' +
          '<circle cx="12" cy="12" r="5"/>' +
          '<line x1="12" y1="1" x2="12" y2="3"/>' +
          '<line x1="12" y1="21" x2="12" y2="23"/>' +
          '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>' +
          '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>' +
          '<line x1="1" y1="12" x2="3" y2="12"/>' +
          '<line x1="21" y1="12" x2="23" y2="12"/>' +
          '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>' +
          '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>' +
        '</svg>';
      return btn;
    }

    // Inject toggle into the nav (before the CTA button or mobile toggle)
    function injectToggle(btn) {
      var navCta     = document.querySelector('.nav-cta');
      var mobileToggle = document.querySelector('.mobile-toggle');
      var navWrapper = document.querySelector('.nav-wrapper');

      if (navCta && navCta.parentNode) {
        navCta.parentNode.insertBefore(btn, navCta);
      } else if (mobileToggle && mobileToggle.parentNode) {
        mobileToggle.parentNode.insertBefore(btn, mobileToggle);
      } else if (navWrapper) {
        navWrapper.appendChild(btn);
      }
    }

    // Apply theme before paint to avoid flash
    var currentTheme = getInitialTheme();
    applyTheme(currentTheme);

    var btn = buildToggleButton();
    injectToggle(btn);

    btn.addEventListener('click', function() {
      currentTheme = document.documentElement.hasAttribute('data-theme') ? 'dark' : 'light';
      applyTheme(currentTheme);
      localStorage.setItem(STORAGE_KEY, currentTheme);
    });

    // Sync if the OS theme changes while the page is open
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function(e) {
        if (!localStorage.getItem(STORAGE_KEY)) {
          currentTheme = e.matches ? 'light' : 'dark';
          applyTheme(currentTheme);
        }
      });
    }
  }

  // ==========================================================================
  // Initialize on DOM Ready
  // ==========================================================================
  
  function init() {
    initThemeToggle();
    initMobileMenu();
    initHeaderScroll();
    initSmoothScroll();
    initLazyLoad();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

