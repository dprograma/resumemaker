/**
 * Template Library - Manages a collection of predefined resume templates
 */

class TemplateLibrary {
    constructor() {
        this.templates = [
            {
                id: 'classic',
                name: 'Classic Professional',
                thumbnail: 'templates/classic.png',
                config: {
                    colorPalette: [
                        { hex: '#333333', rgb: 'rgb(51, 51, 51)' },
                        { hex: '#007bff', rgb: 'rgb(0, 123, 255)' }
                    ],
                    fonts: ['Helvetica', 'Arial', 'sans-serif'],
                    layout: {
                        margins: { top: 20, right: 20, bottom: 20, left: 20 }
                    }
                }
            },
            {
                id: 'modern',
                name: 'Modern Minimalist',
                thumbnail: 'templates/modern.png',
                config: {
                    colorPalette: [
                        { hex: '#2c3e50', rgb: 'rgb(44, 62, 80)' },
                        { hex: '#1abc9c', rgb: 'rgb(26, 188, 156)' }
                    ],
                    fonts: ['Roboto', 'sans-serif'],
                    layout: {
                        margins: { top: 25, right: 25, bottom: 25, left: 25 }
                    }
                }
            },
            {
                id: 'creative',
                name: 'Creative Portfolio',
                thumbnail: 'templates/creative.png',
                config: {
                    colorPalette: [
                        { hex: '#e74c3c', rgb: 'rgb(231, 76, 60)' },
                        { hex: '#34495e', rgb: 'rgb(52, 73, 94)' }
                    ],
                    fonts: ['Montserrat', 'sans-serif'],
                    layout: {
                        margins: { top: 15, right: 15, bottom: 15, left: 15 }
                    }
                }
            }
        ];
        this.libraryContainer = document.getElementById('templateLibrary');
        this.init();
    }

    init() {
        this.renderLibrary();
        this.bindEvents();
    }

    renderLibrary() {
        if (!this.libraryContainer) return;

        this.templates.forEach(template => {
            const templateCard = document.createElement('div');
            templateCard.className = 'template-card';
            templateCard.dataset.templateId = template.id;
            templateCard.innerHTML = `
                <img src="${template.thumbnail}" alt="${template.name}">
                <div class="template-card-name">${template.name}</div>
            `;
            this.libraryContainer.appendChild(templateCard);
        });
    }

    bindEvents() {
        if (!this.libraryContainer) return;

        this.libraryContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.template-card');
            if (card) {
                const templateId = card.dataset.templateId;
                this.selectTemplate(templateId);
            }
        });
    }

    selectTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (template) {
            if (window.previewEngine) {
                window.previewEngine.setTemplateAnalysis(template.config);
            }
            if (window.resumeBuilderApp) {
                window.resumeBuilderApp.currentTemplate = template.config;
                window.resumeBuilderApp.showSuccess(`Template "${template.name}" selected.`);
            }
        }
    }
}

window.TemplateLibrary = TemplateLibrary;