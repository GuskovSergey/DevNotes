document.addEventListener('DOMContentLoaded', () => {
  // Initialize Syntax Highlighting for code snippets
  if (window.hljs) {
    window.hljs.highlightAll();
  }

  // --- Dark Mode / Light Mode Theme Switcher with Seamless Transitions ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const storedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const initialTheme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
  applyTheme(initialTheme, false);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme, true);
    });
  }

  function applyTheme(theme, animate = false) {
    if (animate) {
      document.documentElement.classList.add('theme-in-transition');
    }

    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = theme === 'dark'
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      themeToggleBtn.setAttribute('title', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
      themeToggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
    }

    if (animate) {
      setTimeout(() => {
        document.documentElement.classList.remove('theme-in-transition');
      }, 380);
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