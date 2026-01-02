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
  // Initialize on DOM Ready
  // ==========================================================================
  
  function init() {
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

