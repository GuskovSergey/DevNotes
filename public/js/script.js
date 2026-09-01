document.addEventListener('DOMContentLoaded', () => {
  // Initialize Syntax Highlighting for code snippets
  if (window.hljs) {
    window.hljs.highlightAll();
  }

  // --- Dark Mode / Light Mode Theme Switcher ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const storedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Initialize theme
  const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (themeToggleBtn) {
      themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
      themeToggleBtn.setAttribute('title', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
      themeToggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    }
  }

  // --- Search Bar Toggle & Keyboard Shortcut (⌘K / Ctrl+K) ---
  const searchBtn = document.querySelector('.searchBtn');
  const searchBar = document.querySelector('.searchBar');
  const searchClose = document.getElementById('searchClose');
  const searchInput = document.getElementById('searchInput');

  function openSearch() {
    if (searchBar) {
      searchBar.classList.add('open');
      searchBtn?.setAttribute('aria-expanded', 'true');
      if (searchInput) searchInput.focus();
    }
  }

  function closeSearch() {
    if (searchBar) {
      searchBar.classList.remove('open');
      searchBtn?.setAttribute('aria-expanded', 'false');
    }
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', openSearch);
  }

  if (searchClose) {
    searchClose.addEventListener('click', closeSearch);
  }

  // Keyboard shortcut (⌘K or Ctrl+K) to focus search
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const heroSearchInput = document.querySelector('.dev-hero__search-box input[type="search"]');
      if (heroSearchInput) {
        heroSearchInput.focus();
      } else {
        openSearch();
      }
    } else if (e.key === 'Escape') {
      closeSearch();
    }
  });
});