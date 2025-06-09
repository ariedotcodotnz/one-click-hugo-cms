const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Directories to index
const contentDirs = [
    'content/collections',
    'content/items'
];

// Output file
const outputFile = 'data/search/index.json';

// Build the search index
function buildSearchIndex() {
    const searchIndex = [];
    let idCounter = 0;

    // Process each content directory
    contentDirs.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);

        if (!fs.existsSync(fullPath)) {
            console.log(`Directory ${dir} does not exist, skipping...`);
            return;
        }

        // Get all markdown files
        const files = fs.readdirSync(fullPath)
            .filter(file => file.endsWith('.md') && file !== '_index.md');

        files.forEach(file => {
            const filePath = path.join(fullPath, file);
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const { data, content } = matter(fileContent);

            // Skip drafts
            if (data.draft) return;

            // Build search document
            const doc = {
                id: `doc-${idCounter++}`,
                ref: `/${path.basename(dir)}/${file.replace('.md', '')}/`,
                title: data.title || '',
                description: data.description || '',
                content: stripMarkdown(content).substring(0, 500),
                type: path.basename(dir).slice(0, -1), // Remove 's' from collections/items
                collection: data.collection || '',
                creators: Array.isArray(data.creators) ? data.creators.join(' ') : '',
                subjects: Array.isArray(data.subjects) ? data.subjects.join(' ') : '',
                date: data.metadata?.date || data.date || '',
                thumbnail: data.featured_image || data.access_files?.thumbnail || ''
            };

            // Add metadata fields if they exist
            if (data.metadata) {
                if (data.metadata.creator) {
                    doc.creators = Array.isArray(data.metadata.creator)
                        ? data.metadata.creator.join(' ')
                        : data.metadata.creator;
                }
                if (data.metadata.subject) {
                    doc.subjects = Array.isArray(data.metadata.subject)
                        ? data.metadata.subject.join(' ')
                        : data.metadata.subject;
                }
            }

            searchIndex.push(doc);
        });
    });

    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the index
    fs.writeFileSync(
        outputFile,
        JSON.stringify(searchIndex, null, 2)
    );

    console.log(`Search index built successfully with ${searchIndex.length} documents`);
}

// Strip markdown formatting
function stripMarkdown(content) {
    return content
        // Remove headers
        .replace(/#{1,6}\s+/g, '')
        // Remove bold and italic
        .replace(/\*\*|__/g, '')
        .replace(/\*|_/g, '')
        // Remove links
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        // Remove images
        .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '')
        // Remove code blocks
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        // Remove blockquotes
        .replace(/^\s*>\s+/gm, '')
        // Remove horizontal rules
        .replace(/^---+$/gm, '')
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        .trim();
}

// Run the indexer
if (require.main === module) {
    buildSearchIndex();
}

module.exports = { buildSearchIndex };

// Alternative: Generate search index as Hugo data template
// This can be placed in layouts/_default/search.json
/*
{{- $searchIndex := slice -}}
{{- range where .Site.RegularPages "Type" "in" (slice "collections" "items") -}}
    {{- $searchIndex = $searchIndex | append (dict
        "id" (printf "doc-%d" (len $searchIndex))
        "ref" .Permalink
        "title" .Title
        "description" (.Description | default .Summary)
        "content" (.Plain | truncate 500)
        "type" .Type
        "collection" (.Params.collection | default "")
        "creators" (delimit (.Params.creators | default .Params.metadata.creator | default slice) " ")
        "subjects" (delimit (.Params.subjects | default .Params.metadata.subject | default slice) " ")
        "date" (.Params.metadata.date | default .Date.Format "2006")
        "thumbnail" (.Params.featured_image | default .Params.access_files.thumbnail | default "")
    ) -}}
{{- end -}}
{{ $searchIndex | jsonify }}
*/