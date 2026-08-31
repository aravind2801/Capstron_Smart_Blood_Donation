/* =========================================================================
 * LifeLink - app shell: auth guard, navbar, live notification bell
 * ========================================================================= */

let currentUser = null;

function requireAuth() {
    if (!API.isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

async function loadUser() {
    currentUser = await API.get('/api/user/profile');
    return currentUser;
}

function logout() {
    API.clearToken();
    window.location.href = 'index.html';
}

function isAdmin() {
    return currentUser && currentUser.role === 'ADMIN';
}

function buildNavbar(active) {
    const links = [
        { key: 'home', href: 'home.html', label: 'Home', icon: 'bi-house-door-fill' },
        { key: 'request', href: 'request.html', label: 'Requests', icon: 'bi-clipboard2-heart-fill' },
        { key: 'history', href: 'history.html', label: 'History', icon: 'bi-clock-history' },
    ];
    if (isAdmin()) {
        links.push({ key: 'admin', href: 'admin.html', label: 'Admin', icon: 'bi-shield-lock-fill' });
    }

    const navLinks = links.map(link => `
        <li class="nav-item">
            <a class="nav-link ${active === link.key ? 'active' : ''}" href="${link.href}">
                <i class="bi ${link.icon} me-1"></i>${link.label}
            </a>
        </li>`).join('');

    return `
    <nav class="navbar navbar-expand-lg navbar-dark navbar-lifelink">
        <div class="container">
            <a class="navbar-brand" href="home.html"><span class="heart">&#10084;</span> LifeLink</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav"
                aria-controls="mainNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="mainNav">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                    ${navLinks}
                </ul>
                <div class="d-flex align-items-center gap-2">
                    <div class="bell-wrap">
                        <button class="bell-btn" id="bellBtn" title="Notifications" aria-label="Notifications">
                            <i class="bi bi-bell-fill"></i>
                            <span class="bell-badge" id="bellBadge">0</span>
                        </button>
                        <div class="bell-panel" id="bellPanel">
                            <div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                                <strong class="text-danger-700"><i class="bi bi-bell-fill me-1"></i>Notifications</strong>
                                <button class="btn btn-link btn-sm p-0 text-decoration-none" id="markAllReadBtn">Mark all read</button>
                            </div>
                            <div id="bellList"></div>
                        </div>
                    </div>
                    <button class="btn btn-outline-light btn-sm" id="themeToggle" title="Toggle dark mode">
                        <i class="bi bi-moon-fill"></i>
                    </button>
                    <a class="d-flex align-items-center gap-2 nav-link" href="profile.html" title="Profile">
                        <span class="avatar-wrap">${avatarHtml(currentUser.name, currentUser.photo)}</span>
                        <span class="d-none d-lg-inline">${esc(currentUser.name.split(' ')[0])}</span>
                    </a>
                    <button class="btn btn-outline-light btn-sm" id="logoutBtn"><i class="bi bi-box-arrow-right me-1"></i>Logout</button>
                </div>
            </div>
        </div>
    </nav>`;
}

async function setupShell(active) {
    const slot = document.getElementById('navbarSlot');
    if (!slot) return;
    slot.innerHTML = buildNavbar(active);

    initTheme();
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('logoutBtn').addEventListener('click', logout);

    setupBell();
    await refreshBell();
    setInterval(refreshBell, 15000);
}

/* --------------------------- notification bell --------------------------- */

let bellOpen = false;

function setupBell() {
    const bellBtn = document.getElementById('bellBtn');
    const bellPanel = document.getElementById('bellPanel');

    bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        bellOpen = !bellOpen;
        bellPanel.classList.toggle('open', bellOpen);
        if (bellOpen) refreshBell();
    });

    document.addEventListener('click', (e) => {
        if (bellOpen && !bellPanel.contains(e.target)) {
            bellOpen = false;
            bellPanel.classList.remove('open');
        }
    });

    document.getElementById('markAllReadBtn').addEventListener('click', async () => {
        try {
            await API.put('/api/notifications/read-all');
            showToast('All notifications marked as read', 'success');
            await refreshBell();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    const list = document.getElementById('bellList');
    list.addEventListener('click', async (e) => {
        const item = e.target.closest('.notification-item');
        if (!item) return;
        const id = Number(item.dataset.id);

        if (e.target.closest('.n-accept')) {
            try {
                await API.post('/api/notifications/' + id + '/accept');
                showToast('Request accepted. The patient has been notified.', 'success');
                await refreshBell();
            } catch (err) {
                showToast(err.message, 'error');
            }
            return;
        }
        if (e.target.closest('.n-reject')) {
            try {
                await API.post('/api/notifications/' + id + '/reject');
                showToast('You have declined this request', 'warning');
                await refreshBell();
            } catch (err) {
                showToast(err.message, 'error');
            }
            return;
        }

        if (!item.classList.contains('unread')) return;
        try {
            await API.put('/api/notifications/' + id + '/read');
            item.classList.remove('unread');
            await updateBellBadge();
        } catch (err) {
            /* ignore read errors */
        }
    });
}

async function updateBellBadge() {
    try {
        const res = await API.get('/api/notifications/unread-count');
        const badge = document.getElementById('bellBadge');
        badge.textContent = res.count > 99 ? '99+' : res.count;
        badge.classList.toggle('show', res.count > 0);
        return res.count;
    } catch (err) {
        return 0;
    }
}

async function refreshBell() {
    await updateBellBadge();
    if (!bellOpen) return;
    try {
        const notifications = await API.get('/api/notifications?limit=15');
        renderBellList(notifications);
    } catch (err) {
        /* bell is best-effort */
    }
}

function renderBellList(notifications) {
    const list = document.getElementById('bellList');
    if (!notifications || notifications.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">&#128276;</div>
                <div>No notifications yet</div>
            </div>`;
        return;
    }

    const isDonor = currentUser && currentUser.role === 'DONOR';
    list.innerHTML = notifications.map(n => {
        const canAct = isDonor && !n.read && n.requestId !== null;
        return `
            <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
                <div class="n-title">${esc(n.title)}</div>
                <div class="n-msg">${esc(n.message)}</div>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="n-time">${timeAgo(n.createdAt)}</span>
                    ${canAct ? `
                        <div class="n-actions">
                            <button class="btn btn-success-soft btn-sm n-accept">Accept</button>
                            <button class="btn btn-danger-soft btn-sm n-reject">Reject</button>
                        </div>` : ''}
                </div>
            </div>`;
    }).join('');
}
