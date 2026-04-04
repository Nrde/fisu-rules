<script>
  import { parseSections, searchSections, highlightHtml } from '$lib/parseMarkdown.js';
  import { tick } from 'svelte';

  let { data } = $props();

  const allSections = parseSections(data.markdown);

  let query = $state('');
  let activeId = $state(allSections[0]?.id ?? '');
  let sidebarOpen = $state(false);
  let searchFocused = $state(false);

  let results = $derived(searchSections(allSections, query));
  let isSearching = $derived(query.trim().length > 0);
  let visibleSections = $derived(isSearching ? results : allSections);

  function scrollTo(id) {
    activeId = id;
    sidebarOpen = false;
    tick().then(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function handleKeydown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('search-input')?.focus();
    }
    if (e.key === 'Escape') {
      query = '';
      document.getElementById('search-input')?.blur();
    }
  }

  $effect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !isSearching) {
            activeId = entry.target.id;
          }
        }
      },
      { rootMargin: '-15% 0px -75% 0px' }
    );
    allSections.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app">
  <button class="menu-toggle" onclick={() => sidebarOpen = !sidebarOpen} aria-label="Valikko">
    {#if sidebarOpen}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    {:else}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
    {/if}
  </button>

  {#if sidebarOpen}
    <div class="overlay" role="button" tabindex="0"
      onclick={() => sidebarOpen = false}
      onkeydown={(e) => e.key === 'Enter' && (sidebarOpen = false)}
      aria-label="Sulje valikko">
    </div>
  {/if}

  <aside class="sidebar" class:open={sidebarOpen}>
    <div class="sidebar__logo">
      <div class="logo-mark">
        <img src="./images/fisu_logo_perus_pieni.png">
        <!-- <span class="logo-accent">F</span><span>I</span><span class="logo-accent">SU</span> -->
      </div>
      <div class="logo-text">
        <div class="logo-text__main">Kilpailusäännöt</div>
      </div>
    </div>

    <div class="search-wrap" class:focused={searchFocused}>
      <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
        <path d="m16.5 16.5 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <input
        id="search-input"
        type="text"
        placeholder="Hae säännöistä…"
        bind:value={query}
        onfocus={() => searchFocused = true}
        onblur={() => searchFocused = false}
        autocomplete="off"
        spellcheck="false"
      />
      {#if query}
        <button class="search-clear" onclick={() => query = ''} aria-label="Tyhjennä">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      {:else}
        <kbd>A-K</kbd>
      {/if}
    </div>

    {#if isSearching}
      <div class="search-summary">{results.length} osio{results.length !== 1 ? 'ta' : ''} löytyi</div>
    {/if}

    <nav class="toc" aria-label="Sisällysluettelo">
      {#each (isSearching ? results : allSections) as section}
        <button
          class="toc-item"
          class:active={activeId === section.id}
          class:sub={section.number?.includes('.')}
          onclick={() => scrollTo(section.id)}
        >
          {#if section.number}
            <span class="toc-num">{section.number}</span>
          {/if}
          <span class="toc-title">{section.title}</span>
          {#if isSearching && section.matchCount}
            <span class="toc-badge">{section.matchCount}</span>
          {/if}
        </button>
      {/each}
    </nav>

    <div class="sidebar__footer">
      <div class="version-tag">v2026</div>
      <p>Sääntöjä voidaan tarkentaa perustellusta syystä ennen kilpailun alkua.</p>
    </div>
  </aside>

  <main class="main">
    <header class="page-header">
      <div class="page-header__inner">
        <div class="rule-title">FiSU - Kilpailu<wbr>säännöt</div>
        <p class="page-desc">Finnish Simracing United viralliset kilpailusäännöt.</p>
      </div>
      
    </header>

    {#if isSearching && results.length === 0}
      <div class="no-results">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5"/>
          <path d="m16.5 16.5 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M8 11h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p>Ei tuloksia haulle "<strong>{query}</strong>"</p>
      </div>
    {:else}
      <div class="sections">
        {#each visibleSections as section (section.id)}
          <article class="rule-section" id={section.id}>
            <header class="rule-header">
              {#if section.number}
                <span class="rule-number">{section.number}</span>
              {/if}
              <h2 class="rule-title">{section.title}</h2>
            </header>
            <div class="rule-body prose">
              {@html isSearching ? highlightHtml(section.html, query) : section.html}
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </main>
</div>

<style>
  .app { display: flex; min-height: 100vh; }

  /* Sidebar */
  .sidebar {
    width: var(--sidebar-w);
    flex-shrink: 0;
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
    background: var(--bg-surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    z-index: 100;
  }

  .sidebar__logo { display: flex; align-items: center; gap: 10px; padding: 1.25rem; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .logo-mark { font-family: var(--font-display); font-size: 1.75rem; line-height: 1; letter-spacing: 0.02em; }
  .logo-accent { color: var(--accent); }
  .logo-text__main { font-family: var(--font-display); font-size: 0.875rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-primary); line-height: 1; }
  .logo-text__sub { font-size: 0.6875rem; color: var(--text-muted); letter-spacing: 0.06em; margin-top: 2px; }

  .community-slot { padding: 0.875rem 1.25rem; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .community-slot__inner { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--bg-elevated); border-radius: var(--radius-md); border: 1px dashed var(--border-strong); color: var(--text-muted); font-size: 0.75rem; cursor: pointer; transition: border-color var(--transition), color var(--transition); }
  .community-slot__inner:hover { border-color: var(--accent-border); color: var(--text-secondary); }

  .search-wrap { display: flex; align-items: center; gap: 8px; margin: 0.875rem 1.25rem 0; padding: 8px 10px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-md); transition: border-color var(--transition); flex-shrink: 0; }
  .search-wrap.focused { border-color: var(--accent-border); }
  .search-icon { color: var(--text-muted); flex-shrink: 0; }
  .search-wrap input { flex: 1; background: none; border: none; outline: none; font-family: var(--font-body); font-size: 0.8125rem; color: var(--text-primary); min-width: 0; }
  .search-wrap input::placeholder { color: var(--text-muted); }
  .search-clear { background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 2px; border-radius: 2px; transition: color var(--transition); }
  .search-clear:hover { color: var(--text-primary); }
  kbd { font-family: var(--font-mono); font-size: 0.6875rem; color: var(--text-muted); background: var(--bg-card); border: 1px solid var(--border-strong); border-radius: 3px; padding: 1px 4px; white-space: nowrap; }
  .search-summary { font-size: 0.6875rem; color: var(--text-muted); font-family: var(--font-mono); padding: 6px 1.25rem 0; flex-shrink: 0; }

  .toc { padding: 0.625rem; flex: 1; display: flex; flex-direction: column; gap: 1px; overflow-y: auto; }
  .toc-item { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: none; border: none; border-radius: var(--radius-md); cursor: pointer; text-align: left; width: 100%; transition: background var(--transition), color var(--transition); color: var(--text-secondary); }
  .toc-item:hover { background: var(--bg-elevated); color: var(--text-primary); }
  .toc-item.active { background: var(--accent-muted); color: var(--accent); }
  .toc-item.active .toc-num { color: var(--accent); }
  .toc-item.sub { padding-left: 22px; }
  .toc-item.sub .toc-title { font-size: 0.75rem; }
  .toc-num { font-family: var(--font-mono); font-size: 0.6875rem; color: var(--text-muted); min-width: 22px; flex-shrink: 0; }
  .toc-title { font-size: 0.8125rem; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .toc-badge { font-family: var(--font-mono); font-size: 0.625rem; background: var(--accent-muted); color: var(--accent); border-radius: 10px; padding: 1px 6px; border: 1px solid var(--accent-border); flex-shrink: 0; }

  .sidebar__footer { padding: 0.875rem 1.25rem; border-top: 1px solid var(--border); margin-top: auto; flex-shrink: 0; }
  .version-tag { font-family: var(--font-mono); font-size: 0.625rem; color: var(--accent); background: var(--accent-muted); border: 1px solid var(--accent-border); border-radius: 3px; padding: 2px 6px; display: inline-block; margin-bottom: 6px; letter-spacing: 0.08em; }
  .sidebar__footer p { font-size: 0.6875rem; color: var(--text-muted); line-height: 1.5; }

  /* Main */
  .main { flex: 1; min-width: 0; padding: 0 clamp(1.5rem, 5vw, 4rem); max-width: 840px; }

  .page-header { position: relative; padding: 4rem 0 2.5rem; border-bottom: 1px solid var(--border); overflow: hidden; }
  .page-header__inner { position: relative; z-index: 1; }
  .eyebrow { font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: 0.15em; color: var(--accent); margin-bottom: 0.5rem; text-transform: uppercase; }
  .page-title { font-family: var(--font-display); font-size: clamp(3rem, 8vw, 5.5rem); font-weight: 400; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-primary); line-height: 0.95; margin-bottom: 1rem; }
  .page-desc { font-size: 0.9375rem; color: var(--text-secondary); max-width: 44ch; line-height: 1.6; margin-bottom: 1.75rem; }

  .header-stats { display: flex; align-items: center; gap: 20px; }
  .stat { display: flex; flex-direction: column; gap: 1px; }
  .stat__num { font-family: var(--font-display); font-size: 1.5rem; color: var(--accent); line-height: 1; }
  .stat__label { font-size: 0.6875rem; color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase; font-family: var(--font-mono); }
  .stat-sep { width: 1px; height: 28px; background: var(--border-strong); }

  .racing-line { position: absolute; bottom: 0; left: 0; right: 0; height: 100px; pointer-events: none; }
  .racing-line svg { width: 100%; height: 100%; }

  /* Rule sections */
  .sections { padding-bottom: 5rem; }
  .rule-section { padding: 3rem 0; border-bottom: 1px solid var(--border); scroll-margin-top: 1.5rem; }
  .rule-section:last-child { border-bottom: none; }
  .rule-header { display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1.75rem; }
  .rule-number { font-family: var(--font-display); font-size: 3.5rem; line-height: 1; color: var(--accent); letter-spacing: 0.02em; flex-shrink: 0; }
  .rule-title { font-family: var(--font-display); font-size: 1.875rem; font-weight: 400; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-primary); line-height: 1; }

  /* Prose - styles markdown output */
  .prose :global(p) { color: var(--text-secondary); font-size: 0.9375rem; line-height: 1.75; margin-bottom: 1rem; }
  .prose :global(p:last-child) { margin-bottom: 0; }

  .prose :global(h3) {
    font-family: var(--font-display);
    font-size: 1.125rem;
    font-weight: 400;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-primary);
    margin: 1.75rem 0 0.75rem;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
  }

  .prose :global(h4) {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 1.25rem 0 0.5rem;
  }

  .prose :global(ul), .prose :global(ol) {
    margin: 0.5rem 0 1rem;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .prose :global(li) {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    font-size: 0.9375rem;
    color: var(--text-secondary);
    padding: 9px 14px;
    background: var(--bg-elevated);
    border-radius: var(--radius-md);
    border-left: 2px solid var(--border-strong);
    line-height: 1.5;
  }

  .prose :global(ul > li::before) {
    content: '';
    display: block;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
    margin-top: 7px;
  }

  .prose :global(ol) { counter-reset: prose-ol; }
  .prose :global(ol > li) { counter-increment: prose-ol; border-left-color: var(--accent-border); }
  .prose :global(ol > li::before) {
    content: counter(prose-ol);
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    color: var(--accent);
    background: var(--accent-muted);
    border: 1px solid var(--accent-border);
    border-radius: var(--radius-sm);
    min-width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .prose :global(strong) { font-weight: 500; color: var(--text-primary); }
  .prose :global(em) { color: var(--text-secondary); font-style: italic; }

  .prose :global(blockquote) {
    margin: 1rem 0;
    padding: 12px 16px;
    background: var(--accent-muted);
    border-left: 3px solid var(--accent);
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .prose :global(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    background: var(--bg-elevated);
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--border);
    margin: 1rem 0;
  }
  .prose :global(thead tr) { background: var(--bg-card); border-bottom: 1px solid var(--border); }
  .prose :global(th) { text-align: left; padding: 10px 14px; font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); font-family: var(--font-mono); }
  .prose :global(td) { padding: 10px 14px; color: var(--text-secondary); border-bottom: 1px solid var(--border); }
  .prose :global(tbody tr:last-child td) { border-bottom: none; }
  .prose :global(tbody tr:hover td) { background: var(--bg-card); }

  .prose :global(code) { font-family: var(--font-mono); font-size: 0.8125rem; background: var(--bg-card); border: 1px solid var(--border-strong); border-radius: 3px; padding: 1px 5px; color: var(--accent); }

  .prose :global(hr) { display: none; }

  .prose :global(mark) { background: var(--accent-muted); color: var(--accent); padding: 0 2px; border-radius: 2px; font-style: normal; }

  /* No results */
  .no-results { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 5rem 2rem; color: var(--text-muted); text-align: center; }
  .no-results p { font-size: 0.9375rem; }
  .no-results strong { color: var(--text-secondary); }

  /* Mobile */
  .menu-toggle { display: none; position: fixed; bottom: 1.25rem; right: 1.25rem; z-index: 200; width: 48px; height: 48px; border-radius: 50%; background: var(--accent); border: none; cursor: pointer; align-items: center; justify-content: center; color: var(--bg-base); }
  .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 90; cursor: pointer; }

  @media (max-width: 768px) {
    .sidebar { position: fixed; left: 0; top: 0; bottom: 0; transform: translateX(-100%); transition: transform 200ms ease; }
    .sidebar.open { transform: translateX(0); }
    .menu-toggle { display: flex; }
    .overlay { display: block; }
    .main { padding: 0 1.25rem; }
    .page-header { padding: 2.5rem 0 2rem; }
  }
</style>
