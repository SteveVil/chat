const postListElement = document.getElementById("postList");
const postDetailElement = document.getElementById("postDetail");
const searchInputElement = document.getElementById("searchInput");

let allPosts = [];
let activeSlug = null;

async function fetchPosts() {
  const response = await fetch("/api/posts");

  if (!response.ok) {
    throw new Error("Nepodařilo se načíst seznam článků.");
  }

  return response.json();
}

async function fetchPostBySlug(slug) {
  const response = await fetch(`/api/posts/${encodeURIComponent(slug)}`);

  if (!response.ok) {
    throw new Error("Nepodařilo se načíst detail článku.");
  }

  return response.json();
}

function formatDate(dateString) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderPostList(posts) {
  if (!posts.length) {
    postListElement.innerHTML = `
      <div class="empty-state">
        Žádné články neodpovídají hledání.
      </div>
    `;
    return;
  }

  postListElement.innerHTML = posts
    .map(
      (post) => `
        <button
          class="post-item ${post.slug === activeSlug ? "active" : ""}"
          data-slug="${escapeHtml(post.slug)}"
          type="button"
        >
          <h3>${escapeHtml(post.title)}</h3>
          <div class="post-meta">
            <span class="badge">${escapeHtml(post.category)}</span>
            <span>${escapeHtml(formatDate(post.date))}</span>
          </div>
          <p>${escapeHtml(post.excerpt)}</p>
        </button>
      `
    )
    .join("");

  const buttons = postListElement.querySelectorAll(".post-item");

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const { slug } = button.dataset;
      await renderPostDetail(slug);
      activeSlug = slug;
      renderFilteredPosts(searchInputElement.value);
    });
  });
}

async function renderPostDetail(slug) {
  try {
    postDetailElement.innerHTML = `<p class="status">Načítám detail článku...</p>`;

    const post = await fetchPostBySlug(slug);

    document.title = `${post.title} | Můj Node.js blog`;

    postDetailElement.innerHTML = `
      <h2>${escapeHtml(post.title)}</h2>
      <div class="detail-meta">
        <span class="badge">${escapeHtml(post.category)}</span>
        <span>Autor: ${escapeHtml(post.author)}</span>
        <span>Datum: ${escapeHtml(formatDate(post.date))}</span>
      </div>
      <div class="detail-content">${escapeHtml(post.content)}</div>
    `;
  } catch (error) {
    postDetailElement.innerHTML = `<p class="status">${escapeHtml(error.message)}</p>`;
  }
}

function renderFilteredPosts(searchTerm) {
  const normalizedTerm = searchTerm.trim().toLowerCase();

  const filteredPosts = allPosts.filter((post) => {
    return (
      post.title.toLowerCase().includes(normalizedTerm) ||
      post.excerpt.toLowerCase().includes(normalizedTerm) ||
      post.category.toLowerCase().includes(normalizedTerm)
    );
  });

  renderPostList(filteredPosts);
}

async function init() {
  try {
    allPosts = await fetchPosts();

    if (!allPosts.length) {
      postListElement.innerHTML = `<p class="status">Žádné články nejsou k dispozici.</p>`;
      postDetailElement.innerHTML = `<p class="status">Není co zobrazit.</p>`;
      return;
    }

    activeSlug = allPosts[0].slug;
    renderPostList(allPosts);
    await renderPostDetail(activeSlug);

    searchInputElement.addEventListener("input", () => {
      renderFilteredPosts(searchInputElement.value);
    });
  } catch (error) {
    postListElement.innerHTML = `<p class="status">${escapeHtml(error.message)}</p>`;
    postDetailElement.innerHTML = `<p class="status">${escapeHtml(error.message)}</p>`;
  }
}

init();