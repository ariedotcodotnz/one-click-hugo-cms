(function() {
    'use strict';

    // Initialize Lunr search index
    let searchIndex = null;
    let searchData = [];

    // Build search index
    function initializeSearch() {
        // Get search data from Hugo
        if (window.searchIndex) {
            searchData = window.searchIndex;

            // Build Lunr index
            searchIndex = lunr(function() {
                this.ref('id');
                this.field('title', { boost: 10 });
                this.field('description', { boost: 5 });
                this.field('content');
                this.field('creators', { boost: 3 });
                this.field('subjects', { boost: 3 });
                this.field('collection');
                this.field('type');

                searchData.forEach(function(doc) {
                    this.add(doc);
                }, this);
            });
        }
    }

    // Perform search
    window.searchItems = function(query) {
        if (!searchIndex) {
            initializeSearch();
        }

        if (!query || query.length < 3) {
            return [];
        }

        try {
            const results = searchIndex.search(query);

            return results.map(result => {
                const item = searchData.find(d => d.id === result.ref);
                return {
                    ...item,
                    score: result.score
                };
            }).sort((a, b) => b.score - a.score);
        } catch (e) {
            console.error('Search error:', e);
            return [];
        }
    };

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', initializeSearch);

    // Handle search form submission
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const query = e.target.querySelector('input[name="q"]').value;
            window.location.href = '/search/?q=' + encodeURIComponent(query);
        });
    }

    // Handle search page
    if (window.location.pathname === '/search/') {
        const urlParams = new URLSearchParams(window.location.search);
        const query = urlParams.get('q');

        if (query) {
            document.addEventListener('DOMContentLoaded', function() {
                const results = window.searchItems(query);
                displaySearchResults(results, query);
            });
        }
    }

    function displaySearchResults(results, query) {
        const container = document.getElementById('search-results');
        const countEl = document.getElementById('search-count');

        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-gray-600">No results found for "${query}"</p>
                </div>
            `;
            if (countEl) countEl.textContent = '0 results';
            return;
        }

        if (countEl) countEl.textContent = `${results.length} results`;

        const html = results.map(item => `
            <div class="bg-white rounded-lg shadow hover:shadow-md transition mb-4">
                <a href="${item.ref}" class="block p-6">
                    <div class="flex items-start space-x-4">
                        ${item.thumbnail ? `
                            <img src="${item.thumbnail}" alt="${item.title}" class="w-24 h-24 object-cover rounded">
                        ` : `
                            <div class="w-24 h-24 bg-gray-200 rounded flex items-center justify-center">
                                <span class="text-2xl">${getItemIcon(item.type)}</span>
                            </div>
                        `}
                        <div class="flex-1">
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">${item.title}</h3>
                            <p class="text-gray-600 mb-2">${item.description || ''}</p>
                            <div class="flex items-center space-x-4 text-sm text-gray-500">
                                <span>${item.type}</span>
                                ${item.collection ? `<span>Collection: ${item.collection}</span>` : ''}
                                ${item.date ? `<span>${item.date}</span>` : ''}
                            </div>
                        </div>
                    </div>
                </a>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    function getItemIcon(type) {
        const icons = {
            'image': '📷',
            'document': '📄',
            'audio': '🎵',
            'video': '🎬',
            '3d': '🎲',
            'collection': '📁'
        };
        return icons[type] || '📄';
    }
})();