/**
 * Main Application Controller
 * Initializes and coordinates all application components
 */

class ResumeBuilderApp {
    constructor() {
        this.templateAnalyzer = null;
        this.formHandler = null;
        this.previewEngine = null;
        this.pdfGenerator = null;
        this.templateLibrary = null;
        this.currentTemplate = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeComponents());
            } else {
                this.initializeComponents();
            }
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize the application. Please refresh the page.');
        }
    }

    /**
     * Initialize all application components
     */
    initializeComponents() {
        try {
            // Initialize core components
            this.templateAnalyzer = new TemplateAnalyzer();
            this.formHandler = new FormHandler();
            this.previewEngine = new PreviewEngine();
            this.pdfGenerator = new PDFGenerator();
            this.templateLibrary = new TemplateLibrary();

            // Make components globally available
            window.templateAnalyzer = this.templateAnalyzer;
            window.formHandler = this.formHandler;
            window.previewEngine = this.previewEngine;
            window.pdfGenerator = this.pdfGenerator;
            window.templateLibrary = this.templateLibrary;

            // Bind application events
            this.bindEvents();

            // Initialize template upload functionality
            this.initializeTemplateUpload();

            // Initialize export functionality
            this.initializeExport();

            // Show welcome message
            this.showWelcomeMessage();

            console.log('Resume Builder initialized successfully');
        } catch (error) {
            console.error('Component initialization failed:', error);
            this.showError('Failed to initialize application components.');
        }
    }

    /**
     * Bind application-level events
     */
    bindEvents() {
        // Handle template upload
        const templateInput = document.getElementById('templateInput');
        if (templateInput) {
            templateInput.addEventListener('change', (e) => this.handleTemplateUpload(e));
        }

        // Handle drag and drop for template upload
        const uploadZone = document.getElementById('uploadZone');
        if (uploadZone) {
            uploadZone.addEventListener('click', () => templateInput?.click());
            uploadZone.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            uploadZone.addEventListener('drop', (e) => this.handleDrop(e));
        }

        // Handle export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.handleExport());
        }

        // Handle clear button
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.reset());
        }

        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Handle focus for section toggles
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.formHandler.toggleSection(header.closest('.form-section'));
                }
            });
        });

        // Handle window resize for responsive preview
        window.addEventListener('resize', () => this.handleWindowResize());

        // Handle visibility change for auto-save
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    /**
     * Initialize template upload functionality
     */
    initializeTemplateUpload() {
        // Add supported file types to upload zone
        const uploadZone = document.getElementById('uploadZone');
        if (uploadZone) {
            const supportedTypes = '.pdf, .jpg, .jpeg, .png';
            const description = uploadZone.querySelector('p');
            if (description) {
                description.textContent = `Drag & drop your resume template (${supportedTypes}) or click to browse`;
            }
        }
    }

    /**
     * Initialize export functionality
     */
    initializeExport() {
        // Set up export options
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            // Add dropdown for export options (could be enhanced)
            exportBtn.title = 'Export resume as PDF (Ctrl+E)';
        }
    }

    /**
     * Handle template file upload
     * @param {Event} event - File input change event
     */
    async handleTemplateUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            await this.processTemplateFile(file);
        } catch (error) {
            console.error('Template upload failed:', error);
            this.showError('Failed to process template file. Please try again.');
        }
    }

    /**
     * Handle drag over event
     * @param {DragEvent} event - Drag event
     */
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const uploadZone = document.getElementById('uploadZone');
        if (uploadZone) {
            uploadZone.classList.add('drag-over');
        }
    }

    /**
     * Handle drag leave event
     * @param {DragEvent} event - Drag event
     */
    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const uploadZone = document.getElementById('uploadZone');
        if (uploadZone) {
            uploadZone.classList.remove('drag-over');
        }
    }

    /**
     * Handle drop event
     * @param {DragEvent} event - Drop event
     */
    async handleDrop(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const uploadZone = document.getElementById('uploadZone');
        if (uploadZone) {
            uploadZone.classList.remove('drag-over');
        }

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (this.isValidTemplateFile(file)) {
                try {
                    await this.processTemplateFile(file);
                } catch (error) {
                    console.error('Template processing failed:', error);
                    this.showError('Failed to process template file. Please try again.');
                }
            } else {
                this.showError('Please upload a valid template file (PDF, JPG, JPEG, or PNG).');
            }
        }
    }

    /**
     * Process uploaded template file
     * @param {File} file - Template file
     */
    async processTemplateFile(file) {
        // Show loading indicator
        this.showLoadingIndicator('Analyzing template...');

        try {
            // Validate file
            if (!this.isValidTemplateFile(file)) {
                throw new Error('Invalid file type');
            }

            // Analyze template
            const analysis = await this.templateAnalyzer.analyzeTemplate(file);
            this.currentTemplate = analysis;

            // Update UI with analysis results
            this.displayTemplateAnalysis(analysis);

            // Update preview engine with template
            this.previewEngine.setTemplateAnalysis(analysis);

            // Hide upload section and show analysis
            this.showTemplateAnalysis();

            this.showSuccess('Template analyzed successfully!');
        } catch (error) {
            console.error('Template analysis failed:', error);
            this.showError('Failed to analyze template. Please try a different file.');
        } finally {
            this.hideLoadingIndicator();
        }
    }

    /**
     * Validate template file
     * @param {File} file - File to validate
     * @returns {boolean} Is valid
     */
    isValidTemplateFile(file) {
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        return validTypes.includes(file.type) && file.size <= maxSize;
    }

    /**
     * Display template analysis results
     * @param {Object} analysis - Analysis results
     */
    displayTemplateAnalysis(analysis) {
        // Update dimensions
        const dimensionsEl = document.getElementById('templateDimensions');
        if (dimensionsEl && analysis.dimensions) {
            dimensionsEl.textContent = `${analysis.dimensions.width} × ${analysis.dimensions.height} (${analysis.dimensions.aspectRatio}:1)`;
        }

        // Update color palette
        const paletteEl = document.getElementById('colorPalette');
        if (paletteEl && analysis.colorPalette) {
            paletteEl.innerHTML = '';
            analysis.colorPalette.slice(0, 6).forEach(color => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = color.hex;
                swatch.title = color.hex;
                paletteEl.appendChild(swatch);
            });
        }

        // Update fonts
        const fontsEl = document.getElementById('fontsDetected');
        if (fontsEl && analysis.fonts) {
            fontsEl.textContent = analysis.fonts.length > 0 ? 
                analysis.fonts.slice(0, 3).join(', ') : 
                'Standard web fonts will be used';
        }
    }

    /**
     * Show template analysis section
     */
    showTemplateAnalysis() {
        const analysisSection = document.getElementById('templateAnalysis');
        if (analysisSection) {
            analysisSection.style.display = 'block';
        }
    }

    /**
     * Handle PDF export
     */
    async handleExport() {
        try {
            // Check if there's content to export
            if (!this.hasResumeContent()) {
                this.showError('Please fill out the resume form before exporting.');
                return;
            }

            // Generate PDF
            const pdf = await this.pdfGenerator.generatePDF('A4', {
                useCanvas: true,
                canvasOptions: {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff'
                }
            });

            // Download PDF
            const filename = this.generateFilename();
            this.pdfGenerator.downloadPDF(pdf, filename);

            this.showSuccess('Resume exported successfully!');
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Failed to export resume. Please try again.');
        }
    }

    /**
     * Check if resume has content
     * @returns {boolean} Has content
     */
    hasResumeContent() {
        const formData = this.formHandler?.getFormData();
        if (!formData) return false;

        return formData.personal.fullName || 
               formData.personal.email || 
               formData.summary.text ||
               formData.skills.length > 0 ||
               formData.experience.length > 0;
    }

    /**
     * Generate filename for export
     * @returns {string} Filename
     */
    generateFilename() {
        const formData = this.formHandler?.getFormData();
        const name = formData?.personal.fullName || 'Resume';
        const date = new Date().toISOString().split('T')[0];
        
        return `${name.replace(/\s+/g, '_')}_${date}.pdf`;
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyboardShortcuts(event) {
        // Ctrl+E or Cmd+E - Export
        if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
            event.preventDefault();
            this.handleExport();
        }

        // Ctrl+S or Cmd+S - Save (trigger auto-save)
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            if (this.formHandler) {
                this.formHandler.saveData();
            }
        }

        // Escape - Close modals
        if (event.key === 'Escape') {
            this.closeAllModals();
        }
    }

    /**
     * Handle window resize
     */
    handleWindowResize() {
        // Debounce resize handling
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            // Update preview scaling if needed
            if (this.previewEngine && window.innerWidth < 768) {
                this.previewEngine.fitToWidth();
            }
        }, 250);
    }

    /**
     * Handle visibility change (for auto-save)
     */
    handleVisibilityChange() {
        if (document.hidden && this.formHandler) {
            // Save data when page becomes hidden
            this.formHandler.saveData();
        }
    }

    /**
     * Close all open modals
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    /**
     * Show loading indicator
     * @param {string} message - Loading message
     */
    showLoadingIndicator(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            const messageEl = overlay.querySelector('p');
            if (messageEl) {
                messageEl.textContent = message;
            }
            overlay.style.display = 'flex';
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoadingIndicator() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add styles if not already present
        this.ensureNotificationStyles();

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Get notification icon based on type
     * @param {string} type - Notification type
     * @returns {string} Icon class
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Ensure notification styles are present
     */
    ensureNotificationStyles() {
        if (document.getElementById('notification-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                animation: slideInRight 0.3s ease-out;
            }
            
            .notification-success {
                border-left: 4px solid #10b981;
            }
            
            .notification-error {
                border-left: 4px solid #ef4444;
            }
            
            .notification-warning {
                border-left: 4px solid #f59e0b;
            }
            
            .notification-info {
                border-left: 4px solid #3b82f6;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                padding: 16px;
                gap: 12px;
            }
            
            .notification-content i:first-child {
                font-size: 18px;
            }
            
            .notification-success i:first-child {
                color: #10b981;
            }
            
            .notification-error i:first-child {
                color: #ef4444;
            }
            
            .notification-warning i:first-child {
                color: #f59e0b;
            }
            
            .notification-info i:first-child {
                color: #3b82f6;
            }
            
            .notification-content span {
                flex: 1;
                font-size: 14px;
                color: #374151;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            
            .notification-close:hover {
                background: #f3f4f6;
                color: #374151;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @media (max-width: 768px) {
                .notification {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    /**
     * Show welcome message
     */
    showWelcomeMessage() {
        // Check if this is the first visit
        const hasVisited = localStorage.getItem('resumeBuilderVisited');
        if (!hasVisited) {
            setTimeout(() => {
                this.showNotification('Welcome to Resume Builder! Upload a template or start filling out the form to create your professional resume.', 'info');
                localStorage.setItem('resumeBuilderVisited', 'true');
            }, 1000);
        }
    }

    /**
     * Get application state
     * @returns {Object} Application state
     */
    getState() {
        return {
            hasTemplate: !!this.currentTemplate,
            formData: this.formHandler?.getFormData(),
            templateAnalysis: this.currentTemplate
        };
    }

    /**
     * Reset application
     */
    reset() {
        if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
            // Clear form data
            if (this.formHandler) {
                this.formHandler.clearFormData();
            }

            // Reset template
            this.currentTemplate = null;
            if (this.templateAnalyzer) {
                this.templateAnalyzer.reset();
            }

            // Hide template analysis
            const analysisSection = document.getElementById('templateAnalysis');
            if (analysisSection) {
                analysisSection.style.display = 'none';
            }

            // Reset file input
            const templateInput = document.getElementById('templateInput');
            if (templateInput) {
                templateInput.value = '';
            }

            this.showSuccess('Application reset successfully!');
        }
    }
}

// Initialize application when script loads
const app = new ResumeBuilderApp();

// Make app globally available for debugging
window.resumeBuilderApp = app;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResumeBuilderApp;
}