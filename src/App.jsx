import React, { useState, useEffect, useReducer, useMemo, useCallback } from 'react';

// --- BACKEND API URL CONFIGURATION ---
// Replace the URL inside quotes with your actual Render URL!
const const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/posts';

// Automatically uses Localhost when testing on your computer, and Render when live on Vercel
const API_URL = window.location.hostname === 'localhost' ? LOCAL_URL : RENDER_URL;

const AUTH_KEY = 'community_cms_auth_v1';

// --- LIGHTWEIGHT MARKDOWN PARSER ---
function renderMarkdown(text = '') {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/g, '<br/><br/>');

  return html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
}

// --- MAIN APPLICATION COMPONENT ---
export default function CommunityCMS() {
  const [posts, setPosts] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  });
  const [currentView, setCurrentView] = useState('feed'); // 'feed' | 'admin' | 'login'
  const [editingPost, setEditingPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [authError, setAuthError] = useState('');

  // 1. Fetch posts from backend API when app loads
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error('Failed to fetch posts from server:', err));
  }, []);

  // Auth Handlers
  const handleLogin = useCallback((username, password) => {
    if (username === 'admin' && password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_KEY, 'true');
      setAuthError('');
      setCurrentView('admin');
    } else {
      setAuthError('Invalid credentials. Use admin / admin123');
    }
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_KEY);
    setCurrentView('feed');
  }, []);

  // 2. Save or Update Post via backend API
  const handleSavePost = useCallback(async (postData) => {
    const method = postData.id ? 'PUT' : 'POST';
    const url = postData.id ? `${API_URL}/${postData.id}` : API_URL;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      const savedPost = await res.json();

      setPosts((prev) =>
        postData.id
          ? prev.map((p) => (p.id === savedPost.id ? savedPost : p))
          : [savedPost, ...prev]
      );
      setEditingPost(null);
    } catch (err) {
      console.error('Failed to save post:', err);
    }
  }, []);

  // 3. Delete Post via backend API
  const handleDeletePost = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  }, []);

  // 4. Toggle Post Status (Draft/Published) via backend API
  const handleToggleStatus = useCallback(async (id) => {
    const postToUpdate = posts.find((p) => p.id === id);
    if (!postToUpdate) return;

    const updatedStatus = postToUpdate.status === 'published' ? 'draft' : 'published';
    const updatedPost = { ...postToUpdate, status: updatedStatus };

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPost),
      });
      const data = await res.json();

      setPosts((prev) => prev.map((p) => (p.id === id ? data : p)));
    } catch (err) {
      console.error('Failed to toggle post status:', err);
    }
  }, [posts]);

  // Filtered public feed
  const publishedPosts = useMemo(() => {
    return posts
      .filter((p) => p.status === 'published')
      .filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [posts, searchQuery]);

  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <h1 style={styles.brandTitle}>🏘️ Community Newsletter</h1>
        <nav style={styles.nav}>
          <button
            style={currentView === 'feed' ? styles.activeTab : styles.tab}
            onClick={() => { setCurrentView('feed'); setEditingPost(null); }}
          >
            Public Feed
          </button>
          {isAuthenticated ? (
            <>
              <button
                style={currentView === 'admin' ? styles.activeTab : styles.tab}
                onClick={() => setCurrentView('admin')}
              >
                Dashboard
              </button>
              <button style={styles.logoutBtn} onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <button
              style={currentView === 'login' ? styles.activeTab : styles.tab}
              onClick={() => setCurrentView('login')}
            >
              Admin Login
            </button>
          )}
        </nav>
      </header>

      <main style={styles.mainContent}>
        {currentView === 'feed' && (
          <PublicFeed
            posts={publishedPosts}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {currentView === 'login' && !isAuthenticated && (
          <AuthLoginForm onLogin={handleLogin} error={authError} />
        )}

        {currentView === 'admin' && isAuthenticated && (
          <>
            {editingPost !== null ? (
              <PostEditor
                initialData={editingPost}
                onSave={handleSavePost}
                onCancel={() => setEditingPost(null)}
              />
            ) : (
              <AdminDashboard
                posts={posts}
                onCreateNew={() => setEditingPost({ title: '', content: '', status: 'draft' })}
                onEdit={(post) => setEditingPost(post)}
                onDelete={handleDeletePost}
                onToggleStatus={handleToggleStatus}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// --- PUBLIC FEED COMPONENT ---
function PublicFeed({ posts, searchQuery, setSearchQuery }) {
  return (
    <div style={styles.feedWrapper}>
      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="Search announcements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.input}
        />
      </div>

      {posts.length === 0 ? (
        <p style={styles.emptyState}>No announcements found.</p>
      ) : (
        posts.map((post) => (
          <article key={post.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.postTitle}>{post.title}</h2>
              <span style={styles.dateBadge}>
                {new Date(post.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
            <div
              style={styles.postBody}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
            />
          </article>
        ))
      )}
    </div>
  );
}

// --- ADMIN DASHBOARD COMPONENT ---
function AdminDashboard({ posts, onCreateNew, onEdit, onDelete, onToggleStatus }) {
  const [filter, setFilter] = useState('all');

  const filteredPosts = useMemo(() => {
    if (filter === 'all') return posts;
    return posts.filter((p) => p.status === filter);
  }, [posts, filter]);

  return (
    <div>
      <div style={styles.dashboardActions}>
        <h2>Announcement Management</h2>
        <button style={styles.primaryBtn} onClick={onCreateNew}>
          + New Post
        </button>
      </div>

      <div style={styles.filterGroup}>
        {['all', 'published', 'draft'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={filter === status ? styles.filterBtnActive : styles.filterBtn}
          >
            {status.toUpperCase()} ({posts.filter((p) => status === 'all' || p.status === status).length})
          </button>
        ))}
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Updated</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.map((post) => (
              <tr key={post.id} style={styles.tr}>
                <td style={styles.td}>{post.title}</td>
                <td style={styles.td}>
                  <span style={post.status === 'published' ? styles.publishedTag : styles.draftTag}>
                    {post.status}
                  </span>
                </td>
                <td style={styles.td}>
                  {new Date(post.updatedAt).toLocaleDateString()}
                </td>
                <td style={styles.td}>
                  <button style={styles.actionBtn} onClick={() => onToggleStatus(post.id)}>
                    {post.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button style={styles.actionBtn} onClick={() => onEdit(post)}>
                    Edit
                  </button>
                  <button style={styles.dangerBtn} onClick={() => onDelete(post.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- MARKDOWN POST EDITOR COMPONENT ---
function PostEditor({ initialData, onSave, onCancel }) {
  const [title, setTitle] = useState(initialData.title || '');
  const [content, setContent] = useState(initialData.content || '');
  const [status, setStatus] = useState(initialData.status || 'draft');
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required fields.');
      return;
    }
    onSave({
      ...initialData,
      title: title.trim(),
      content,
      status
    });
  };

  const insertFormatting = (syntax) => {
    setContent((prev) => prev + ` ${syntax} `);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.formContainer}>
      <h3>{initialData.id ? 'Edit Announcement' : 'Create New Announcement'}</h3>
      {error && <div style={styles.errorMessage}>{error}</div>}

      <div style={styles.formGroup}>
        <label style={styles.label}>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Announcement Title"
          style={styles.input}
        />
      </div>

      <div style={styles.formGroup}>
        <div style={styles.editorToolbar}>
          <label style={styles.label}>Content (Markdown)</label>
          <div>
            <button type="button" onClick={() => insertFormatting('**bold**')} style={styles.toolBtn}>B</button>
            <button type="button" onClick={() => insertFormatting('*italic*')} style={styles.toolBtn}>I</button>
            <button type="button" onClick={() => insertFormatting('### Heading')} style={styles.toolBtn}>H3</button>
            <button type="button" onClick={() => setPreview(!preview)} style={styles.toolBtn}>
              {preview ? 'Write Mode' : 'Preview Mode'}
            </button>
          </div>
        </div>

        {preview ? (
          <div
            style={styles.previewBox}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        ) : (
          <textarea
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write markdown here..."
            style={styles.textarea}
          />
        )}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Workflow Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={styles.input}>
          <option value="draft">Save as Draft</option>
          <option value="published">Publish Immediately</option>
        </select>
      </div>

      <div style={styles.buttonGroup}>
        <button type="submit" style={styles.primaryBtn}>
          Save Post
        </button>
        <button type="button" style={styles.secondaryBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// --- AUTHENTICATION COMPONENT ---
function AuthLoginForm({ onLogin, error }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div style={styles.loginCard}>
      <h2>Admin Login</h2>
      {error && <div style={styles.errorMessage}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <button type="submit" style={styles.primaryBtn}>
          Sign In
        </button>
      </form>
    </div>
  );
}

// --- LIGHTWEIGHT INLINE STYLES ---
const styles = {
  appContainer: { maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eaeaea', paddingBottom: '16px', marginBottom: '24px' },
  brandTitle: { margin: 0, fontSize: '1.5rem', color: '#2c3e50' },
  nav: { display: 'flex', gap: '8px' },
  tab: { background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', fontSize: '14px' },
  activeTab: { background: '#0066cc', color: '#fff', border: 'none', padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', fontSize: '14px' },
  logoutBtn: { background: '#f5f5f5', border: '1px solid #ccc', padding: '8px 16px', cursor: 'pointer', borderRadius: '4px' },
  mainContent: { minHeight: '400px' },
  feedWrapper: { display: 'flex', flexDirection: 'column', gap: '16px' },
  searchBar: { marginBottom: '16px' },
  card: { border: '1px solid #e0e0e0', borderRadius: '8px', padding: '20px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' },
  postTitle: { margin: 0, fontSize: '1.25rem' },
  dateBadge: { fontSize: '0.85rem', color: '#666' },
  postBody: { lineHeight: '1.6', color: '#333' },
  dashboardActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  filterGroup: { display: 'flex', gap: '8px', marginBottom: '16px' },
  filterBtn: { background: '#f0f0f0', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
  filterBtnActive: { background: '#333', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { borderBottom: '2px solid #ddd', padding: '10px' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '10px' },
  publishedTag: { background: '#e6f4ea', color: '#137333', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  draftTag: { background: '#feefc3', color: '#b06000', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  actionBtn: { marginRight: '6px', background: '#e0e0e0', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' },
  dangerBtn: { background: '#fce8e6', color: '#c5221f', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' },
  formContainer: { background: '#fafafa', padding: '24px', borderRadius: '8px', border: '1px solid #eee' },
  formGroup: { marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontWeight: 'bold', fontSize: '14px' },
  input: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  textarea: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', fontFamily: 'monospace' },
  editorToolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  toolBtn: { marginLeft: '4px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' },
  previewBox: { padding: '12px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '150px', background: '#fff' },
  buttonGroup: { display: 'flex', gap: '10px', marginTop: '16px' },
  primaryBtn: { background: '#0066cc', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  secondaryBtn: { background: '#eee', border: 'none', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer' },
  loginCard: { maxWidth: '360px', margin: '40px auto', padding: '24px', border: '1px solid #ddd', borderRadius: '8px' },
  errorMessage: { background: '#fce8e6', color: '#c5221f', padding: '10px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' },
  emptyState: { textAlign: 'center', color: '#888', padding: '40px' }
};