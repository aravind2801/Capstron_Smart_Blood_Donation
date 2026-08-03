/* =========================================================================
 * LifeLink - donor card rendering, grids and pagination
 * ========================================================================= */

function donorCardHtml(donor) {
    const photo = donor.photo
        ? `<img class="donor-avatar" src="${esc(donor.photo)}" alt="${esc(donor.name)}">`
        : `<div class="donor-initials">${esc(initials(donor.name))}</div>`;
    const location = [donor.city, donor.district].filter(Boolean).join(', ');

    return `
        <div class="col-md-6 col-lg-4 col-xl-3">
            <div class="card-lifelink donor-card">
                <div class="donor-photo">${photo}</div>
                <div class="donor-body">
                    <div class="d-flex justify-content-between align-items-start gap-2">
                        <h5 class="donor-name mb-0">${esc(donor.name)}</h5>
                        <span class="bg-chip">${esc(donor.bloodGroup)}</span>
                    </div>
                    <p class="donor-meta mb-1"><i class="bi bi-geo-alt-fill me-1"></i>${esc(location || 'Location not set')}</p>
                    <p class="donor-distance mb-1"><i class="bi bi-signpost-split me-1"></i>${distanceText(donor.distanceKm)}</p>
                    <p class="donor-meta mb-2"><i class="bi bi-calendar-heart me-1"></i>Last donation: ${formatDate(donor.lastDonationDate)}</p>
                    <div class="mt-auto pt-2">
                        <button class="btn btn-lifelink w-100 btn-sm" data-request-group="${esc(donor.bloodGroup)}">
                            <i class="bi bi-heart-pulse-fill me-1"></i>Request Blood
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
}

function renderDonorGrid(donors, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!donors || donors.length === 0) {
        container.innerHTML = `
            <div class="empty-state col-12">
                <div class="empty-icon">&#128269;</div>
                <div>No available donors found for this search.</div>
            </div>`;
        return;
    }
    container.innerHTML = donors.map(donorCardHtml).join('');
}

function renderPagination(pageData, containerId, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!pageData || pageData.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    const page = pageData.page;
    const total = pageData.totalPages;
    let items = '';
    for (let p = 0; p < total; p++) {
        if (total > 9 && p > 2 && p < total - 3 && Math.abs(p - page) > 1) {
            if (items[items.length - 1] !== '…') items += '<li class="page-item disabled"><span class="page-link">…</span></li>';
            continue;
        }
        items += `<li class="page-item ${p === page ? 'active' : ''}">
            <button class="page-link" data-page="${p}">${p + 1}</button></li>`;
    }
    container.innerHTML = `
        <nav><ul class="pagination pagination-lifelink justify-content-center">
            <li class="page-item ${page === 0 ? 'disabled' : ''}">
                <button class="page-link" data-page="${page - 1}">&laquo;</button></li>
            ${items}
            <li class="page-item ${page >= total - 1 ? 'disabled' : ''}">
                <button class="page-link" data-page="${page + 1}">&raquo;</button></li>
        </ul></nav>`;
    container.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = parseInt(btn.dataset.page, 10);
            if (p >= 0 && p < total && p !== page) onPageChange(p);
        });
    });
}

/* Request buttons on donor cards */
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-request-group]');
    if (btn) {
        openRequestModal({ bloodGroup: btn.dataset.requestGroup });
    }
});
