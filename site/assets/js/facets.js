(function() {
    'use strict';

    // Handle facet filtering
    document.addEventListener('DOMContentLoaded', function() {
        const facetForm = document.querySelector('.facets-container');
        if (!facetForm) return;

        // Get all facet checkboxes
        const checkboxes = facetForm.querySelectorAll('input[type="checkbox"]');
        const applyButton = facetForm.querySelector('button[type="submit"], button:last-child');

        // Handle apply button click
        if (applyButton) {
            applyButton.addEventListener('click', function() {
                applyFilters();
            });
        }

        // Also apply on checkbox change (optional)
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                // Could auto-apply or wait for button click
                // applyFilters();
            });
        });

        function applyFilters() {
            const params = new URLSearchParams(window.location.search);

            // Clear existing filter params
            ['collection', 'type', 'subject', 'creator', 'date_from', 'date_to'].forEach(param => {
                params.delete(param);
            });

            // Add checked facets
            checkboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    params.append(checkbox.name, checkbox.value);
                }
            });

            // Add date range
            const dateFrom = facetForm.querySelector('input[placeholder="From year"]');
            const dateTo = facetForm.querySelector('input[placeholder="To year"]');

            if (dateFrom && dateFrom.value) {
                params.append('date_from', dateFrom.value);
            }
            if (dateTo && dateTo.value) {
                params.append('date_to', dateTo.value);
            }

            // Redirect with new params
            window.location.href = window.location.pathname + '?' + params.toString();
        }

        // Restore facet state from URL
        function restoreFacets() {
            const params = new URLSearchParams(window.location.search);

            checkboxes.forEach(checkbox => {
                const values = params.getAll(checkbox.name);
                checkbox.checked = values.includes(checkbox.value);
            });

            // Restore date range
            const dateFrom = facetForm.querySelector('input[placeholder="From year"]');
            const dateTo = facetForm.querySelector('input[placeholder="To year"]');

            if (dateFrom && params.get('date_from')) {
                dateFrom.value = params.get('date_from');
            }
            if (dateTo && params.get('date_to')) {
                dateTo.value = params.get('date_to');
            }
        }

        restoreFacets();
    });

    // Handle collection stats
    window.updateCollectionStats = function() {
        const statsEl = document.querySelector('.collection-stats');
        if (!statsEl) return;

        // This would typically come from an API or be pre-rendered
        const stats = {
            totalItems: document.querySelectorAll('.item-card').length,
            totalCollections: document.querySelectorAll('.collection-card').length
        };

        statsEl.innerHTML = `
            <div class="flex space-x-6 text-sm text-gray-600">
                <span>${stats.totalItems} items</span>
                <span>${stats.totalCollections} collections</span>
            </div>
        `;
    };
})();