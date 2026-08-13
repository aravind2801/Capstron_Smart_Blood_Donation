/* =========================================================================
 * LifeLink - requests page (My Requests + donor's Available For Me)
 * ========================================================================= */

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;
    showSpinner(true);
    try {
        await loadUser();
        await setupShell('request');
        window.onRequestCreated = () => loadAll();
        window.onRequestListChanged = () => loadAll();
        setupRequestsPage();
        await loadAll();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        showSpinner(false);
    }
});

function setupRequestsPage() {
    document.getElementById('newRequestBtn').addEventListener('click', () => openRequestModal({}));

    if (currentUser.role === 'DONOR') {
        document.getElementById('availableTabWrap').classList.remove('d-none');
    }
}

async function loadAll() {
    await Promise.all([loadMyRequests(), loadAvailable()]);
}

async function loadMyRequests() {
    try {
        const endpoint = currentUser.role === 'PATIENT' ? '/api/requests/mine' : '/api/requests/donor';
        const requests = await API.get(endpoint);
        renderRequestList(requests, 'myRequestsList', `
            <div class="empty-state">
                <div class="empty-icon">&#128203;</div>
                <div>You have no requests yet.</div>
            </div>`);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadAvailable() {
    if (currentUser.role !== 'DONOR') return;
    try {
        const requests = await API.get('/api/requests/available');
        renderRequestList(requests, 'availableRequestsList', `
            <div class="empty-state">
                <div class="empty-icon">&#128275;</div>
                <div>No pending requests match your blood group right now.</div>
            </div>`);
    } catch (err) {
        showToast(err.message, 'error');
    }
}
