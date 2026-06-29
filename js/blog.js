/* WegWorks Blog hub — article sorting */
(function() {
  'use strict';

  function sortArticles(sortBy) {
    var grid = document.getElementById('articles-grid');
    if (!grid) return;

    var articles = Array.from(grid.querySelectorAll('.article-card'));

    articles.sort(function(a, b) {
      if (sortBy === 'newest') {
        return new Date(b.dataset.date) - new Date(a.dataset.date);
      }
      if (sortBy === 'oldest') {
        return new Date(a.dataset.date) - new Date(b.dataset.date);
      }
      if (sortBy === 'title') {
        return a.dataset.title.localeCompare(b.dataset.title);
      }
      return 0;
    });

    articles.forEach(function(article) {
      grid.appendChild(article);
    });
  }

  window.sortArticles = sortArticles;

  document.addEventListener('DOMContentLoaded', function() {
    sortArticles('newest');
  });
})();
