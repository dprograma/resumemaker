/**
 * Preview Engine - Handles real-time resume preview generation
 * Renders resume based on template analysis and user data
 */

class PreviewEngine {
    constructor() {
        this.previewContainer = document.getElementById('resumePreview');
        this.templateAnalysis = null;
        this.currentZoom = 1.0;
        this.defaultTemplate = this.getDefaultTemplate();
        this.fontMatcher = new FontMatcher();
        
        this.init();
    }

    /**
     * Initialize preview engine
     */
    init() {
        this.bindEvents();
        this.setupZoomControls();
        this.renderDefaultPreview();
    }

    /**
     * Bind preview events
     */
    bindEvents() {
        // Zoom controls
        document.getElementById('zoomIn')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOut')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('fitToWidth')?.addEventListener('click', () => this.fitToWidth());
    }

    /**
     * Setup zoom controls
     */
    setupZoomControls() {
        this.updateZoomDisplay();
    }

    /**
     * Set template analysis results
     * @param {Object} analysis - Template analysis results
     */
    setTemplateAnalysis(analysis) {
        this.templateAnalysis = analysis;
        this.updatePreview();
    }

    /**
     * Update preview with current form data
     * @param {Object} formData - Form data
     */
    updatePreview(formData = null) {
        if (!formData && window.formHandler) {
            formData = window.formHandler.getFormData();
        }

        if (!formData) {
            this.renderDefaultPreview();
            return;
        }

        const template = this.templateAnalysis || this.defaultTemplate;
        this.renderResume(formData, template);
    }

    /**
     * Render resume with data and template
     * @param {Object} formData - Form data
     * @param {Object} template - Template configuration
     */
    renderResume(formData, template) {
        const resumePage = this.previewContainer.querySelector('.resume-page');
        if (!resumePage) return;

        // Clear existing content
        resumePage.innerHTML = '';

        // Create resume content container
        const resumeContent = document.createElement('div');
        resumeContent.className = 'resume-content';
        resumePage.appendChild(resumeContent);

        // Apply template styles
        this.applyTemplateStyles(resumePage, template);

        // Render sections based on template layout
        this.renderHeader(resumeContent, formData, template);
        this.renderSummary(resumeContent, formData, template);
        this.renderSkills(resumeContent, formData, template);
        this.renderExperience(resumeContent, formData, template);
        this.renderEducation(resumeContent, formData, template);
        this.renderProjects(resumeContent, formData, template);
        this.renderCertifications(resumeContent, formData, template);
        this.renderAdditional(resumeContent, formData, template);
    }

    /**
     * Apply template styles to resume page
     * @param {HTMLElement} resumePage - Resume page element
     * @param {Object} template - Template configuration
     */
    applyTemplateStyles(resumePage, template) {
        // Apply color scheme
        if (template.colorPalette && template.colorPalette.length > 0) {
            const primaryColor = template.colorPalette[0].hex;
            const secondaryColor = template.colorPalette[1]?.hex || '#666666';
            
            resumePage.style.setProperty('--resume-primary-color', primaryColor);
            resumePage.style.setProperty('--resume-secondary-color', secondaryColor);
        }

        // Apply typography
        if (template.fonts && template.fonts.length > 0) {
            const primaryFont = this.fontMatcher.matchFont(template.fonts[0]);
            resumePage.style.setProperty('--resume-primary-font', primaryFont);
        }

        // Apply layout margins
        if (template.layout && template.layout.margins) {
            const margins = template.layout.margins;
            const content = resumePage.querySelector('.resume-content');
            if (content) {
                content.style.padding = `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px`;
            }
        }
    }

    /**
     * Render header section
     * @param {HTMLElement} container - Container element
     * @param {Object} formData - Form data
     * @param {Object} template - Template configuration
     */
    renderHeader(container, formData, template) {
        const header = document.createElement('div');
        header.className = 'resume-header';
        
        const headerContent = document.createElement('div');
        headerContent.className = 'header-content';
        
        // Personal information
        const personalInfo = document.createElement('div');
        personalInfo.className = 'personal-info';
        
        if (formData.personal.fullName) {
            const name = document.createElement('h1');
            name.className = 'full-name';
            name.textContent = formData.personal.fullName;
            personalInfo.appendChild(name);
        }
        
        if (formData.personal.jobTitle) {
            const jobTitle = document.createElement('h2');
            jobTitle.className = 'job-title';
            jobTitle.textContent = formData.personal.jobTitle;
            personalInfo.appendChild(jobTitle);
        }
        
        // Contact information
        const contactInfo = document.createElement('div');
        contactInfo.className = 'contact-info';
        
        const contactItems = [
            { icon: 'fas fa-envelope', value: formData.personal.email },
            { icon: 'fas fa-phone', value: formData.personal.phone },
            { icon: 'fas fa-map-marker-alt', value: formData.personal.address }
        ];
        
        contactItems.forEach(item => {
            if (item.value) {
                const contactItem = document.createElement('div');
                contactItem.className = 'contact-item';
                contactItem.innerHTML = `
                    <i class="${item.icon}"></i>
                    <span>${item.value}</span>
                `;
                contactInfo.appendChild(contactItem);
            }
        });
        
        personalInfo.appendChild(contactInfo);
        headerContent.appendChild(personalInfo);
        
        // Profile photo
        if (formData.personal.profilePhoto) {
            const photoContainer = document.createElement('div');
            photoContainer.className = 'profile-photo';
            
            const photo = document.createElement('img');
            photo.src = formData.personal.profilePhoto;
            photo.alt = 'Profile Photo';
            photoContainer.appendChild(photo);
            
            headerContent.appendChild(photoContainer);
        }
        
        header.appendChild(headerContent);
        container.appendChild(header);
    }

    renderProjects(container, formData, template) {
        if (!formData.projects || formData.projects.length === 0) return;

        const section = document.createElement('div');
        section.className = 'resume-section projects-section';

        const title = document.createElement('h3');
        title.className = 'section-title';
        title.textContent = 'Projects';
        section.appendChild(title);

        const content = document.createElement('div');
        content.className = 'section-content';

        formData.projects.forEach(project => {
            const projectItem = document.createElement('div');
            projectItem.className = 'project-item';

            if (project.name) {
                const projectName = document.createElement('h4');
                projectName.textContent = project.name;
                projectItem.appendChild(projectName);
            }

            if (project.description) {
                const projectDescription = document.createElement('div');
                projectDescription.className = 'project-description';
                projectDescription.innerHTML = project.description.replace(/\n/g, '<br>');
                projectItem.appendChild(projectDescription);
            }

            content.appendChild(projectItem);
        });

        section.appendChild(content);
        container.appendChild(section);
    }

    /**
     * Render summary section
     * @param {HTMLElement} container - Container element
     * @param {Object} formData - Form data
     * @param {Object} template - Template configuration
     */
    renderSummary(container, formData, template) {
        if (!formData.summary.text) return;
        
        const section = document.createElement('div');
        section.className = 'resume-section summary-section';
        
        const title = document.createElement('h3');
        title.className = 'section-title';
        title.textContent = 'Professional Summary';
        section.appendChild(title);
        
        const content = document.createElement('div');
        content.className = 'section-content';
        
        const summary = document.createElement('p');
        summary.className = 'summary-text';
        summary.textContent = formData.summary.text;
        content.appendChild(summary);
        
        section.appendChild(content);
        container.appendChild(section);
    }

    /**
     * Render skills section
     * @param {HTMLElement} container - Container element
     * @param {Object} formData - Form data
     * @param {Object} template - Template configuration
     */
    renderSkills(container, formData, template) {
        if (!formData.skills || formData.skills.length === 0) return;
        
        const section = document.createElement('div');
        section.className = 'resume-section skills-section';
        
        const title = document.createElement('h3');
        title.className = 'section-title';
        title.textContent = 'Skills & Competencies';
        section.appendChild(title);
        
        const content = document.createElement('div');
        content.className = 'section-content';
        
        const skillsGrid = document.createElement('div');
        skillsGrid.className = 'skills-grid';
        
        formData.skills.forEach(skill => {
            const skillItem = document.createElement('div');
            skillItem.className = 'skill-item';
            
            const skillName = document.createElement('span');
            skillName.className = 'skill-name';
            skillName.textContent = skill.name;
            
            const skillLevel = document.createElement('div');
            skillLevel.className = 'skill-level';
            
            const levelBar = document.createElement('div');
            levelBar.className = 'level-bar';
            
            const levelFill = document.createElement('div');
            levelFill.className = 'level-fill';
            
            // Set skill level width
            const levelWidths = {
                beginner: '25%',
                intermediate: '50%',
                advanced: '75%',
                expert: '100%'
            };
            levelFill.style.width = levelWidths[skill.level] || '50%';
            
            levelBar.appendChild(levelFill);
            skillLevel.appendChild(levelBar);
            
            skillItem.appendChild(skillName);
            skillItem.appendChild(skillLevel);
            skillsGrid.appendChild(skillItem);
        });
        
        content.appendChild(skillsGrid);
        section.appendChild(content);
        container.appendChild(section);
    }

    /**
     * Render experience section
     * @param {HTMLElement} container - Container element
     * @param {Object} formData - Form data
     * @param {Object} template - Template configuration
     */
    renderExperience(container, formData, template) {
        if (!formData.experience || formData.experience.length === 0) return;
        
        const section = document.createElement('div');
        section.className = 'resume-section experience-section';
        
        const title = document.createElement('h3');
        title.className = 'section-title';
        title.textContent = 'Work Experience';
        section.appendChild(title);
        
        const content = document.createElement('div');
        content.className = 'section-content';
        
        formData.experience.forEach(exp => {
            const expItem = document.createElement('div');
            expItem.className = 'experience-item';
            
            const expHeader = document.createElement('div');
            expHeader.className = 'experience-header';
            
            const expTitle = document.createElement('div');
            expTitle.className = 'experience-title';
            
            if (exp.jobTitle) {
                const jobTitle = document.createElement('h4');
                jobTitle.textContent = exp.jobTitle;
                expTitle.appendChild(jobTitle);
            }
            
            if (exp.company) {
                const company = document.createElement('span');
                company.className = 'company-name';
                company.textContent = exp.company;
                expTitle.appendChild(company);
            }
            
            const expDates = document.createElement('div');
            expDates.className = 'experience-dates';
            
            if (exp.startDate || exp.endDate) {
                const dateRange = this.formatDateRange(exp.startDate, exp.endDate);
                expDates.textContent = dateRange;
            }
            
            expHeader.appendChild(expTitle);
            expHeader.appendChild(expDates);
            expItem.appendChild(expHeader);
            
            if (exp.description) {
                const description = document.createElement('div');
                description.className = 'experience-description';
                const expDescription = document.createElement('div');
                expDescription.className = 'experience-description';
                expDescription.innerHTML = exp.description.replace(/\n/g, '<br>');
                expItem.appendChild(expDescription);
            }
            
            content.appendChild(expItem);
        });
        
        section.appendChild(content);
        container.appendChild(section);
    }

    /**
     * Render education section
     * @param {HTMLElement} container - Container element
     * @param {Object} formData - Form data
     * @param {Object} template - Template configuration
     */
    renderEducation(container, formData, template) {
        if (!formData.education || formData.education.length === 0) return;
        
        const section = document.createElement('div');
        section.className = 'resume-section education-section';
        
        const title = document.createElement('h3');
        title.className = 'section-title';
        title.textContent = 'Education';
        section.appendChild(title);
        
        const content = document.createElement('div');
        content.className = 'section-content';
        
        formData.education.forEach(edu => {
            const eduItem = document.createElement('div');
            eduItem.className = 'education-item';
            
            const eduHeader = document.createElement('div');
            eduHeader.className = 'education-header';
            
            const eduTitle = document.createElement('div');
            eduTitle.className = 'education-title';
            
            if (edu.degree) {
                const degree = document.createElement('h4');
                degree.textContent = edu.degree;
                if (edu.fieldOfStudy) {
                    degree.textContent += ` in ${edu.fieldOfStudy}`;
                }
                eduTitle.appendChild(degree);
            }
            
            if (edu.institution) {
                const institution = document.createElement('span');
                institution.className = 'institution-name';
                institution.textContent = edu.institution;
                eduTitle.appendChild(institution);
            }
            
            const eduDetails = document.createElement('div');
            eduDetails.className = 'education-details';
            
            const details = [];
            if (edu.graduationYear) details.push(`Graduated: ${edu.graduationYear}`);
            if (edu.gpa) details.push(`GPA: ${edu.gpa}`);
            
            if (details.length > 0) {
                eduDetails.textContent = details.join(' | ');
            }
            
            eduHeader.appendChild(eduTitle);
            if (details.length > 0) {
                eduHeader.appendChild(eduDetails);
            }
            eduItem.appendChild(eduHeader);
            
            content.appendChild(eduItem);
        });
        
        section.appendChild(content);
        container.appendChild(section);
    }

    /**
     * Render certifications section
     * @param {HTMLElement} container - Container element
     * @param {Object} formData - Form data
     * @param {Object} template - Template configuration
     */
    renderCertifications(container, formData, template) {
        if (!formData.certifications || formData.certifications.length === 0) return;
        
        const section = document.createElement('div');
        section.className = 'resume-section certifications-section';
        
        const title = document.createElement('h3');
        title.className = 'section-title';
        title.textContent = 'Certifications';
        section.appendChild(title);
        
        const content = document.createElement('div');
        content.className = 'section-content';
        
        const certsList = document.createElement('div');
        certsList.className = 'certifications-list';
        
        formData.certifications.forEach(cert => {
            const certItem = document.createElement('div');
            certItem.className = 'certification-item';
            
            if (cert.name) {
                const certName = document.createElement('h4');
                certName.textContent = cert.name;
                certItem.appendChild(certName);
            }
            
            const certDetails = document.createElement('div');
            certDetails.className = 'certification-details';
            
            const details = [];
            if (cert.issuer) details.push(cert.issuer);
            if (cert.date) details.push(this.formatDate(cert.date));
            
            if (details.length > 0) {
                certDetails.textContent = details.join(' | ');
            }
            
            certItem.appendChild(certDetails);
            certsList.appendChild(certItem);
        });
        
        content.appendChild(certsList);
        section.appendChild(content);
        container.appendChild(section);
    }

    renderAdditional(container, formData, template) {
        const hasLanguages = formData.additional.languages && formData.additional.languages.trim();
        const hasInterests = formData.additional.interests && formData.additional.interests.trim();
        const hasReferences = formData.additional.references && formData.additional.references.trim();
        
        if (!hasLanguages && !hasInterests && !hasReferences) return;
        
        const section = document.createElement('div');
        section.className = 'resume-section additional-section';
        
        const content = document.createElement('div');
        content.className = 'section-content additional-content';
        
        if (hasLanguages) {
            const languagesDiv = document.createElement('div');
            languagesDiv.className = 'additional-item';
            
            const languagesTitle = document.createElement('h4');
            languagesTitle.textContent = 'Languages';
            languagesDiv.appendChild(languagesTitle);
            
            const languagesContent = document.createElement('p');
            languagesContent.innerHTML = formData.additional.languages.replace(/\n/g, '<br>');
            languagesDiv.appendChild(languagesContent);
            
            content.appendChild(languagesDiv);
        }
        
        if (hasInterests) {
            const interestsDiv = document.createElement('div');
            interestsDiv.className = 'additional-item';
            
            const interestsTitle = document.createElement('h4');
            interestsTitle.textContent = 'Interests & Hobbies';
            interestsDiv.appendChild(interestsTitle);
            
            const interestsContent = document.createElement('p');
            interestsContent.innerHTML = formData.additional.interests.replace(/\n/g, '<br>');
            interestsDiv.appendChild(interestsContent);
            
            content.appendChild(interestsDiv);
        }
        
        if (hasReferences) {
            const referencesDiv = document.createElement('div');
            referencesDiv.className = 'additional-item';
            
            const referencesTitle = document.createElement('h4');
            referencesTitle.textContent = 'References';
            referencesDiv.appendChild(referencesTitle);
            
            const referencesContent = document.createElement('p');
            referencesContent.innerHTML = formData.additional.references.replace(/\n/g, '<br>');
            referencesDiv.appendChild(referencesContent);
            
            content.appendChild(referencesDiv);
        }
        
        section.appendChild(content);
        container.appendChild(section);
    }

    /**
     * Render default preview placeholder
     */
    renderDefaultPreview() {
        const resumePage = this.previewContainer.querySelector('.resume-page');
        if (!resumePage) return;

        resumePage.innerHTML = `
            <div class="resume-content">
                <div class="preview-placeholder">
                    <i class="fas fa-file-alt"></i>
                    <h3>Your resume will appear here</h3>
                    <p>Start filling out the form to see your resume come to life</p>
                </div>
            </div>
        `;
    }

    /**
     * Format date range
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     * @returns {string} Formatted date range
     */
    formatDateRange(startDate, endDate) {
        const start = startDate ? this.formatDate(startDate) : '';
        const end = endDate === 'Present' ? 'Present' : (endDate ? this.formatDate(endDate) : '');
        
        if (start && end) {
            return `${start} - ${end}`;
        } else if (start) {
            return start;
        } else if (end) {
            return end;
        }
        return '';
    }

    /**
     * Format date
     * @param {string} dateString - Date string (YYYY-MM format)
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        if (!dateString) return '';
        
        const [year, month] = dateString.split('-');
        if (!year || !month) return dateString;
        
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const monthIndex = parseInt(month) - 1;
        const monthName = monthNames[monthIndex] || month;
        
        return `${monthName} ${year}`;
    }

    /**
     * Zoom in
     */
    zoomIn() {
        this.currentZoom = Math.min(this.currentZoom + 0.1, 2.0);
        this.applyZoom();
    }

    /**
     * Zoom out
     */
    zoomOut() {
        this.currentZoom = Math.max(this.currentZoom - 0.1, 0.3);
        this.applyZoom();
    }

    /**
     * Fit to width
     */
    fitToWidth() {
        const container = this.previewContainer.querySelector('.preview-container');
        const resumePage = this.previewContainer.querySelector('.resume-page');
        
        if (container && resumePage) {
            const containerWidth = container.clientWidth - 40; // Account for padding
            const pageWidth = 210; // A4 width in mm, converted to approximate pixels
            this.currentZoom = containerWidth / (pageWidth * 3.78); // mm to px conversion
            this.applyZoom();
        }
    }

    /**
     * Apply zoom transformation
     */
    applyZoom() {
        const resumePreview = this.previewContainer.querySelector('.resume-preview');
        if (resumePreview) {
            resumePreview.style.transform = `scale(${this.currentZoom})`;
        }
        this.updateZoomDisplay();
    }

    /**
     * Update zoom display
     */
    updateZoomDisplay() {
        const zoomLevel = document.getElementById('zoomLevel');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.currentZoom * 100)}%`;
        }
    }

    /**
     * Get default template configuration
     * @returns {Object} Default template
     */
    getDefaultTemplate() {
        return {
            colorPalette: [
                { hex: '#2563eb', rgb: 'rgb(37, 99, 235)' },
                { hex: '#64748b', rgb: 'rgb(100, 116, 139)' }
            ],
            fonts: ['Inter', 'Arial', 'sans-serif'],
            layout: {
                margins: { top: 20, right: 20, bottom: 20, left: 20 },
                sections: [],
                textBlocks: []
            }
        };
    }
}

/**
 * Font Matcher - Matches detected fonts to web-safe alternatives
 */
class FontMatcher {
    constructor() {
        this.fontMap = {
            // Common serif fonts
            'Times': 'Times New Roman, serif',
            'Times New Roman': 'Times New Roman, serif',
            'Georgia': 'Georgia, serif',
            'Garamond': 'Garamond, serif',
            
            // Common sans-serif fonts
            'Arial': 'Arial, sans-serif',
            'Helvetica': 'Helvetica, Arial, sans-serif',
            'Calibri': 'Calibri, Arial, sans-serif',
            'Verdana': 'Verdana, sans-serif',
            'Tahoma': 'Tahoma, sans-serif',
            'Inter': 'Inter, Arial, sans-serif',
            'Roboto': 'Roboto, Arial, sans-serif',
            'Open Sans': 'Open Sans, Arial, sans-serif',
            'Lato': 'Lato, Arial, sans-serif',
            'Montserrat': 'Montserrat, Arial, sans-serif',
            
            // Monospace fonts
            'Courier': 'Courier New, monospace',
            'Courier New': 'Courier New, monospace',
            'Monaco': 'Monaco, Courier New, monospace',
            'Consolas': 'Consolas, Courier New, monospace'
        };
    }

    /**
     * Match font to web-safe alternative
     * @param {string} fontName - Font name to match
     * @returns {string} Web-safe font stack
     */
    matchFont(fontName) {
        if (!fontName) return 'Inter, Arial, sans-serif';
        
        // Clean font name
        const cleanName = fontName.replace(/['"]/g, '').trim();
        
        // Direct match
        if (this.fontMap[cleanName]) {
            return this.fontMap[cleanName];
        }
        
        // Partial match
        for (const [key, value] of Object.entries(this.fontMap)) {
            if (cleanName.toLowerCase().includes(key.toLowerCase()) || 
                key.toLowerCase().includes(cleanName.toLowerCase())) {
                return value;
            }
        }
        
        // Default fallback based on font characteristics
        if (cleanName.toLowerCase().includes('serif')) {
            return 'Times New Roman, serif';
        } else if (cleanName.toLowerCase().includes('mono') || 
                   cleanName.toLowerCase().includes('code')) {
            return 'Courier New, monospace';
        } else {
            return 'Inter, Arial, sans-serif';
        }
    }
}

// Add resume-specific styles
const resumeStyles = `
    .resume-page {
        --resume-primary-color: #2563eb;
        --resume-secondary-color: #64748b;
        --resume-primary-font: 'Inter', Arial, sans-serif;
    }
    
    .resume-header {
        display: flex;
        align-items: flex-start;
        gap: 20px;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid var(--resume-primary-color);
    }
    
    .profile-photo {
        flex-shrink: 0;
    }
    
    .profile-photo img {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid var(--resume-primary-color);
    }
    
    .personal-info {
        flex: 1;
    }
    
    .full-name {
        font-size: 28px;
        font-weight: 700;
        color: var(--resume-primary-color);
        margin: 0 0 8px 0;
        font-family: var(--resume-primary-font);
    }
    
    .job-title {
        font-size: 18px;
        font-weight: 500;
        color: var(--resume-secondary-color);
        margin: 0 0 15px 0;
        font-family: var(--resume-primary-font);
    }
    
    .contact-info {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
    }
    
    .contact-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--resume-secondary-color);
    }
    
    .contact-item i {
        color: var(--resume-primary-color);
        width: 16px;
    }
    
    .resume-section {
        margin-bottom: 25px;
    }
    
    .section-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--resume-primary-color);
        margin: 0 0 15px 0;
        padding-bottom: 5px;
        border-bottom: 1px solid #e2e8f0;
        font-family: var(--resume-primary-font);
    }
    
    .section-content {
        font-size: 14px;
        line-height: 1.6;
        color: var(--resume-secondary-color);
    }
    
    .summary-text {
        margin: 0;
        text-align: justify;
    }
    
    .skills-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
    }
    
    .skill-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
    }
    
    .skill-name {
        font-weight: 500;
        flex: 1;
    }
    
    .skill-level {
        flex: 1;
        max-width: 80px;
    }
    
    .level-bar {
        height: 6px;
        background: #e2e8f0;
        border-radius: 3px;
        overflow: hidden;
    }
    
    .level-fill {
        height: 100%;
        background: var(--resume-primary-color);
        border-radius: 3px;
        transition: width 0.3s ease;
    }
    
    .experience-item,
    .education-item {
        margin-bottom: 20px;
    }
    
    .experience-header,
    .education-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 8px;
    }
    
    .experience-title h4,
    .education-title h4 {
        font-size: 16px;
        font-weight: 600;
        color: var(--resume-primary-color);
        margin: 0 0 4px 0;
    }
    
    .company-name,
    .institution-name {
        font-size: 14px;
        color: var(--resume-secondary-color);
        font-weight: 500;
    }
    
    .experience-dates,
    .education-details {
        font-size: 13px;
        color: var(--resume-secondary-color);
        font-weight: 500;
        white-space: nowrap;
    }
    
    .experience-description {
        margin-top: 8px;
        color: var(--resume-secondary-color);
        text-align: justify;
    }
    
    .certifications-list {
        display: grid;
        gap: 12px;
    }
    
    .certification-item h4 {
        font-size: 15px;
        font-weight: 600;
        color: var(--resume-primary-color);
        margin: 0 0 4px 0;
    }
    
    .certification-details {
        font-size: 13px;
        color: var(--resume-secondary-color);
    }
    
    .additional-content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
    }
    
    .additional-item h4 {
        font-size: 15px;
        font-weight: 600;
        color: var(--resume-primary-color);
        margin: 0 0 8px 0;
    }
    
    .additional-item p {
        margin: 0;
        color: var(--resume-secondary-color);
    }
    
    @media print {
        .resume-page {
            box-shadow: none !important;
            margin: 0 !important;
        }
        
        .resume-content {
            padding: 15mm !important;
        }
    }
`;

// Inject styles into document
if (!document.getElementById('resume-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'resume-styles';
    styleSheet.textContent = resumeStyles;
    document.head.appendChild(styleSheet);
}

// Export for use in other modules
window.PreviewEngine = PreviewEngine;
window.FontMatcher = FontMatcher;