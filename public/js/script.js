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

    // Switch Highlight.js theme dynamically between Atom One Dark and Atom One Light
    const hljsCss = document.getElementById('hljs-theme-stylesheet');
    if (hljsCss) {
      hljsCss.href = theme === 'dark'
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css';
    }
    
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

  // --- Command Palette (⌘K) & Live Search API ---
  const searchBtn = document.querySelector('.searchBtn');
  const searchBar = document.getElementById('searchModalOverlay') || document.querySelector('.searchBar');
  const searchClose = document.getElementById('searchClose');
  const searchInput = document.getElementById('searchInput');
  const searchLiveResults = document.getElementById('searchLiveResults');
  let selectedIndex = -1;
  let debounceTimer = null;

  function openSearch() {
    if (searchBar) {
      searchBar.classList.add('open');
      searchBtn?.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  }

  function closeSearch() {
    if (searchBar) {
      searchBar.classList.remove('open');
      searchBtn?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      selectedIndex = -1;
    }
  }

  if (searchBtn) searchBtn.addEventListener('click', openSearch);
  if (searchClose) searchClose.addEventListener('click', closeSearch);

  // Close when clicking backdrop
  if (searchBar) {
    searchBar.addEventListener('click', (e) => {
      if (e.target === searchBar) closeSearch();
    });
  }

  // Quick Suggest Chip Clicks
  document.querySelectorAll('.quick-suggest-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-query');
      if (searchInput && q) {
        searchInput.value = q;
        fetchLiveResults(q);
      }
    });
  });

  // Live Input Debounce
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      clearTimeout(debounceTimer);

      if (!val) {
        renderQuickSuggestions();
        return;
      }

      debounceTimer = setTimeout(() => {
        fetchLiveResults(val);
      }, 200);
    });

    // Keyboard Arrow Navigation & Selection inside search modal
    searchInput.addEventListener('keydown', (e) => {
      const items = searchLiveResults ? searchLiveResults.querySelectorAll('.search-result-item') : [];
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (items.length === 0) return;
        selectedIndex = (selectedIndex + 1) % items.length;
        updateItemSelection(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (items.length === 0) return;
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        updateItemSelection(items);
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && items[selectedIndex]) {
          e.preventDefault();
          const href = items[selectedIndex].getAttribute('href');
          if (href) window.location.href = href;
        }
      }
    });
  }

  function updateItemSelection(items) {
    items.forEach((item, idx) => {
      if (idx === selectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  async function fetchLiveResults(query) {
    if (!searchLiveResults) return;

    searchLiveResults.innerHTML = `<div class="search-loading-state"><div class="spinner"></div> Searching articles for "${escapeHtml(query)}"...</div>`;

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!data.results || data.results.length === 0) {
        searchLiveResults.innerHTML = `
          <div class="search-empty-live">
            <span>🔍 No matches found for "${escapeHtml(query)}"</span>
            <div style="margin-top: 0.4rem; font-size: 0.8rem; color: var(--text-muted);">Try searching for terms like "Array", "JavaScript", or "Express"</div>
          </div>
        `;
        return;
      }

      let html = `<div class="search-suggestions-header">Articles & Tutorials (${data.total})</div>`;
      html += `<div class="search-results-list">`;

      data.results.forEach((item, idx) => {
        html += `
          <a href="/post/${item.id}" class="search-result-item ${idx === selectedIndex ? 'selected' : ''}">
            <div class="search-result-item__main">
              <div class="search-result-item__title">${highlightMatch(item.title, query)}</div>
              <div class="search-result-item__snippet">${highlightMatch(item.snippet, query)}</div>
            </div>
            <div class="search-result-item__meta">
              ${item.category ? `<span class="tech-badge" style="font-size: 0.68rem; padding: 0.1rem 0.45rem;">${escapeHtml(item.category)}</span>` : ''}
              <span class="search-result-item__time">${item.readTime} min read</span>
            </div>
          </a>
        `;
      });

      html += `</div>`;
      searchLiveResults.innerHTML = html;
    } catch (err) {
      searchLiveResults.innerHTML = `<div class="search-empty-live">⚠️ Error loading search results. Please press Enter to search.</div>`;
    }
  }

  function renderQuickSuggestions() {
    if (!searchLiveResults) return;
    searchLiveResults.innerHTML = `
      <div class="search-suggestions-header">Quick Suggestions</div>
      <div class="search-quick-tags">
        <button type="button" class="quick-suggest-chip" data-query="Array.prototype">Array.prototype</button>
        <button type="button" class="quick-suggest-chip" data-query="JavaScript">JavaScript</button>
        <button type="button" class="quick-suggest-chip" data-query="Express">Express</button>
        <button type="button" class="quick-suggest-chip" data-query="Sequelize">Sequelize</button>
      </div>
    `;

    document.querySelectorAll('.quick-suggest-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.getAttribute('data-query');
        if (searchInput && q) {
          searchInput.value = q;
          fetchLiveResults(q);
        }
      });
    });
  }

  function highlightMatch(text, query) {
    if (!text || !query) return escapeHtml(text || '');
    const escaped = escapeHtml(text);
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return escaped.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Keyboard shortcut (⌘K or Ctrl+K) to focus search
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearch();
    } else if (e.key === 'Escape') {
      closeSearch();
    }
  });

  // Seamless SPA Category Filter Handler (No Page Reload)
  const categoryPills = document.querySelectorAll('.categories-pills .category-pill');
  const articlesContainer = document.querySelector('.articles');

  if (categoryPills.length > 0 && articlesContainer) {
    categoryPills.forEach(pill => {
      pill.addEventListener('click', async (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();

        const targetUrl = pill.getAttribute('href');
        const urlObj = new URL(targetUrl, window.location.origin);
        const categorySlug = urlObj.searchParams.get('category') || '';

        // 1. Update Active Pill UI
        categoryPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        // 2. Update Browser URL silently without reloading
        window.history.pushState({ category: categorySlug }, '', targetUrl);

        // 3. Update Heading
        const heading = articlesContainer.querySelector('.articles__heading');
        if (heading) {
          heading.textContent = categorySlug ? 'Topic Articles' : 'Recent Articles';
        }

        // 4. Fade Grid Out
        const currentGrid = articlesContainer.querySelector('.article-grid') || articlesContainer.querySelector('.articles-empty');
        if (currentGrid) {
          currentGrid.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
          currentGrid.style.opacity = '0.3';
          currentGrid.style.transform = 'translateY(6px)';
        }

        try {
          const res = await fetch(`/api/posts?category=${encodeURIComponent(categorySlug)}&page=1`);
          const json = await res.json();
          const posts = json.posts || [];

          // Handle featured post section visibility on page 1
          let displayPosts = posts;
          const featuredSection = document.querySelector('.featured-post-card')?.closest('section');
          if (featuredSection) {
            if (!categorySlug) {
              featuredSection.style.display = 'block';
              if (posts.length > 1) displayPosts = posts.slice(1);
            } else {
              featuredSection.style.display = 'none';
            }
          }

          let html = '';
          if (displayPosts.length === 0) {
            html = `<div class="articles-empty" style="background: var(--bg-surface); border: 1px dashed var(--border-light); padding: 3rem; border-radius: var(--radius-lg); text-align: center; color: var(--text-muted); transition: opacity 0.3s ease;">
              No articles found in this category yet.
            </div>`;
          } else {
            html = `<ul class="article-grid" style="opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease; transform: translateY(10px);">`;
            displayPosts.forEach(post => {
              const tagsHtml = (post.tags && post.tags.length > 0) ? `
                <div class="article-card__tags">
                  ${post.tags.slice(0, 3).map(t => `<a href="/tag/${t.slug}" class="tech-badge" style="text-decoration: none; font-size: 0.7rem; padding: 0.15rem 0.55rem;">#${t.name}</a>`).join('')}
                </div>` : '';

              const mediaHtml = post.featuredImage ? `<img src="${post.featuredImage}" alt="${post.title}" class="article-card__cover">` : `<div class="article-card__placeholder"><span>&lt;DevHub / Article&gt;</span></div>`;

              const categoryBadge = post.category ? `<span class="article-card__badge-floating">${post.category.name}</span>` : '';

              html += `
                <li class="article-card">
                  <div class="article-card__media-wrapper">
                    ${categoryBadge}
                    ${mediaHtml}
                  </div>
                  <div class="article-card__body">
                    <div class="article-card__meta-top">
                      <span>${post.createdAtFormatted}</span>
                      <span>•</span>
                      <span>⏱ ${post.readingTime}</span>
                      <span>•</span>
                      <span>👁 ${post.viewsCount} views</span>
                    </div>
                    <h3 class="article-card__title">
                      <a href="/post/${post._id}">${post.title}</a>
                    </h3>
                    <p class="article-card__excerpt">${post.body ? post.body.replace(/[#*`_]/g, '').substring(0, 130) + '...' : ''}</p>
                    ${tagsHtml}
                  </div>
                  <div class="article-card__footer">
                    <a href="/post/${post._id}" class="article-card__read-link">
                      <span>Read Article</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </a>
                  </div>
                </li>
              `;
            });
            html += `</ul>`;
          }

          const oldGrid = articlesContainer.querySelector('.article-grid') || articlesContainer.querySelector('.articles-empty');
          const paginationDiv = articlesContainer.querySelector('.pagination')?.closest('div');
          
          if (oldGrid) oldGrid.remove();
          if (paginationDiv) paginationDiv.remove();

          if (heading) {
            heading.insertAdjacentHTML('afterend', html);
          }

          const newGrid = articlesContainer.querySelector('.article-grid') || articlesContainer.querySelector('.articles-empty');
          requestAnimationFrame(() => {
            if (newGrid) {
              newGrid.style.opacity = '1';
              newGrid.style.transform = 'translateY(0)';
            }
          });

          if (json.nextPage) {
            const pageLink = `<div style="text-align: center; margin-top: 2rem;">
              <a href="/?page=${json.nextPage}${categorySlug ? '&category=' + categorySlug : ''}" class="pagination">&lt; Older Articles</a>
            </div>`;
            articlesContainer.insertAdjacentHTML('beforeend', pageLink);
          }

        } catch (err) {
          console.error('Error fetching category posts:', err);
          window.location.href = targetUrl;
        }
      });
    });

    window.addEventListener('popstate', () => {
      const currentCategory = new URLSearchParams(window.location.search).get('category') || '';
      const matchingPill = Array.from(categoryPills).find(p => {
        const pSlug = new URL(p.href, window.location.origin).searchParams.get('category') || '';
        return pSlug === currentCategory;
      });
      if (matchingPill) {
        matchingPill.click();
      }
    });
  }

  // --- 1-Click Code Block Copy & Language Header Enhancer ---
  function enhanceCodeBlocks() {
    const codeBlocks = document.querySelectorAll('.article-content pre code, .article-body pre code');
    codeBlocks.forEach((codeEl) => {
      const preEl = codeEl.parentElement;
      if (!preEl || preEl.parentElement.classList.contains('code-block-wrapper')) return;

      // Detect programming language class e.g. class="language-javascript"
      let lang = 'CODE';
      const classList = Array.from(codeEl.classList);
      const langClass = classList.find(c => c.startsWith('language-') || c.startsWith('lang-'));
      if (langClass) {
        lang = langClass.replace(/^(language-|lang-)/, '').toUpperCase();
      }

      // Create wrapper container and header bar
      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';

      const headerBar = document.createElement('div');
      headerBar.className = 'code-header-bar';
      headerBar.innerHTML = `
        <div class="code-window-dots">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <span class="code-lang-badge">${lang}</span>
        </div>
        <button type="button" class="code-copy-btn" title="Copy code snippet">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span class="copy-text">Copy</span>
        </button>
      `;

      preEl.parentNode.insertBefore(wrapper, preEl);
      wrapper.appendChild(headerBar);
      wrapper.appendChild(preEl);

      const copyBtn = headerBar.querySelector('.code-copy-btn');
      const copyText = headerBar.querySelector('.copy-text');

      copyBtn.addEventListener('click', async () => {
        const textToCopy = codeEl.innerText;
        try {
          await navigator.clipboard.writeText(textToCopy);
          copyBtn.classList.add('copied');
          copyText.textContent = '✓ Copied!';
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyText.textContent = 'Copy';
          }, 2000);
        } catch (err) {
          console.error('Failed to copy code snippet:', err);
        }
      });
    });
  }

  enhanceCodeBlocks();
});