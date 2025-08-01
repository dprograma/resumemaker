/**
 * PDF Generator - Handles high-quality PDF generation
 * Creates print-optimized PDFs with vector graphics and embedded fonts
 */

class PDFGenerator {
    constructor() {
        this.pageFormats = {
            A4: { width: 210, height: 297 }, // mm
            Letter: { width: 216, height: 279 } // mm
        };
        this.currentFormat = 'A4';
        this.dpi = 300; // High resolution for print
        this.margins = { top: 20, right: 20, bottom: 20, left: 20 }; // mm
    }

    /**
     * Generate PDF from current resume preview
     * @param {string} format - Page format (A4 or Letter)
     * @param {Object} options - Generation options
     * @returns {Promise<Blob>} PDF blob
     */
    async generatePDF(format = 'A4', options = {}) {
        try {
            this.currentFormat = format;
            const pageFormat = this.pageFormats[format];
            
            // Show loading indicator
            this.showLoadingIndicator();
            
            // Get resume content
            const resumeElement = document.querySelector('.resume-page');
            if (!resumeElement) {
                throw new Error('Resume content not found');
            }
            
            // Create PDF document
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: format.toLowerCase(),
                compress: true
            });
            
            // Set high-quality rendering
            pdf.setProperties({
                title: 'Resume',
                creator: 'Resume Builder',
                producer: 'Resume Builder PDF Generator'
            });
            
            // Generate PDF content
            await this.renderToPDF(pdf, resumeElement, pageFormat, options);
            
            // Hide loading indicator
            this.hideLoadingIndicator();
            
            return pdf;
            
        } catch (error) {
            this.hideLoadingIndicator();
            console.error('PDF generation failed:', error);
            throw error;
        }
    }

    /**
     * Render resume content to PDF
     * @param {jsPDF} pdf - PDF document
     * @param {HTMLElement} element - Resume element
     * @param {Object} pageFormat - Page format
     * @param {Object} options - Rendering options
     */
    async renderToPDF(pdf, element, pageFormat, options) {
        // Method 1: Use html2canvas for high-quality rendering
        if (options.useCanvas !== false) {
            await this.renderWithCanvas(pdf, element, pageFormat, options);
        } else {
            // Method 2: Direct HTML to PDF conversion
            await this.renderWithHTML(pdf, element, pageFormat, options);
        }
    }

    /**
     * Render using html2canvas for pixel-perfect output
     * @param {jsPDF} pdf - PDF document
     * @param {HTMLElement} element - Resume element
     * @param {Object} pageFormat - Page format
     * @param {Object} options - Rendering options
     */
    async renderWithCanvas(pdf, element, pageFormat, options) {
        // Temporarily scale element for high-resolution capture
        const originalTransform = element.style.transform;
        const scale = this.dpi / 96; // Convert from screen DPI to print DPI
        
        element.style.transform = `scale(${scale})`;
        element.style.transformOrigin = 'top left';
        
        // Configure html2canvas for high quality
        const canvasOptions = {
            scale: 1, // We're already scaling the element
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            width: pageFormat.width * 3.78 * scale, // mm to px conversion
            height: pageFormat.height * 3.78 * scale,
            scrollX: 0,
            scrollY: 0,
            windowWidth: pageFormat.width * 3.78 * scale,
            windowHeight: pageFormat.height * 3.78 * scale,
            ...options.canvasOptions
        };
        
        try {
            const canvas = await html2canvas(element, canvasOptions);
            
            // Reset element transform
            element.style.transform = originalTransform;
            
            // Add canvas to PDF
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const imgWidth = pageFormat.width - this.margins.left - this.margins.right;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(
                imgData,
                'JPEG',
                this.margins.left,
                this.margins.top,
                imgWidth,
                imgHeight,
                undefined,
                'FAST'
            );
            
        } catch (error) {
            // Reset element transform on error
            element.style.transform = originalTransform;
            throw error;
        }
    }

    /**
     * Render using direct HTML to PDF conversion
     * @param {jsPDF} pdf - PDF document
     * @param {HTMLElement} element - Resume element
     * @param {Object} pageFormat - Page format
     * @param {Object} options - Rendering options
     */
    async renderWithHTML(pdf, element, pageFormat, options) {
        // Extract and render content sections
        const sections = this.extractContentSections(element);
        let currentY = this.margins.top;
        
        for (const section of sections) {
            const sectionHeight = await this.renderSection(pdf, section, currentY, pageFormat);
            currentY += sectionHeight + 5; // Add spacing between sections
            
            // Check if we need a new page
            if (currentY > pageFormat.height - this.margins.bottom - 20) {
                pdf.addPage();
                currentY = this.margins.top;
            }
        }
    }

    /**
     * Extract content sections from resume element
     * @param {HTMLElement} element - Resume element
     * @returns {Array} Content sections
     */
    extractContentSections(element) {
        const sections = [];
        
        // Header section
        const header = element.querySelector('.resume-header');
        if (header) {
            sections.push({
                type: 'header',
                element: header,
                content: this.extractHeaderContent(header)
            });
        }
        
        // Other sections
        const resumeSections = element.querySelectorAll('.resume-section');
        resumeSections.forEach(section => {
            const sectionType = this.getSectionType(section);
            sections.push({
                type: sectionType,
                element: section,
                content: this.extractSectionContent(section, sectionType)
            });
        });
        
        return sections;
    }

    /**
     * Extract header content
     * @param {HTMLElement} header - Header element
     * @returns {Object} Header content
     */
    extractHeaderContent(header) {
        const content = {
            name: '',
            jobTitle: '',
            contact: [],
            photo: null
        };
        
        const nameEl = header.querySelector('.full-name');
        if (nameEl) content.name = nameEl.textContent.trim();
        
        const jobTitleEl = header.querySelector('.job-title');
        if (jobTitleEl) content.jobTitle = jobTitleEl.textContent.trim();
        
        const contactItems = header.querySelectorAll('.contact-item');
        contactItems.forEach(item => {
            const icon = item.querySelector('i');
            const text = item.querySelector('span');
            if (text) {
                content.contact.push({
                    icon: icon ? icon.className : '',
                    text: text.textContent.trim()
                });
            }
        });
        
        const photoEl = header.querySelector('.profile-photo img');
        if (photoEl) content.photo = photoEl.src;
        
        return content;
    }

    /**
     * Extract section content
     * @param {HTMLElement} section - Section element
     * @param {string} type - Section type
     * @returns {Object} Section content
     */
    extractSectionContent(section, type) {
        const content = {
            title: '',
            items: []
        };
        
        const titleEl = section.querySelector('.section-title');
        if (titleEl) content.title = titleEl.textContent.trim();
        
        switch (type) {
            case 'summary':
                const summaryEl = section.querySelector('.summary-text');
                if (summaryEl) content.text = summaryEl.textContent.trim();
                break;
                
            case 'skills':
                const skillItems = section.querySelectorAll('.skill-item');
                skillItems.forEach(item => {
                    const name = item.querySelector('.skill-name');
                    const level = item.querySelector('.level-fill');
                    if (name) {
                        content.items.push({
                            name: name.textContent.trim(),
                            level: level ? level.style.width : '50%'
                        });
                    }
                });
                break;
                
            case 'experience':
                const expItems = section.querySelectorAll('.experience-item');
                expItems.forEach(item => {
                    const title = item.querySelector('.experience-title h4');
                    const company = item.querySelector('.company-name');
                    const dates = item.querySelector('.experience-dates');
                    const description = item.querySelector('.experience-description');
                    
                    content.items.push({
                        title: title ? title.textContent.trim() : '',
                        company: company ? company.textContent.trim() : '',
                        dates: dates ? dates.textContent.trim() : '',
                        description: description ? description.textContent.trim() : ''
                    });
                });
                break;
                
            case 'education':
                const eduItems = section.querySelectorAll('.education-item');
                eduItems.forEach(item => {
                    const title = item.querySelector('.education-title h4');
                    const institution = item.querySelector('.institution-name');
                    const details = item.querySelector('.education-details');
                    
                    content.items.push({
                        title: title ? title.textContent.trim() : '',
                        institution: institution ? institution.textContent.trim() : '',
                        details: details ? details.textContent.trim() : ''
                    });
                });
                break;
                
            case 'certifications':
                const certItems = section.querySelectorAll('.certification-item');
                certItems.forEach(item => {
                    const title = item.querySelector('h4');
                    const details = item.querySelector('.certification-details');
                    
                    content.items.push({
                        title: title ? title.textContent.trim() : '',
                        details: details ? details.textContent.trim() : ''
                    });
                });
                break;
                
            default:
                // Handle additional sections
                const additionalItems = section.querySelectorAll('.additional-item');
                additionalItems.forEach(item => {
                    const title = item.querySelector('h4');
                    const text = item.querySelector('p');
                    
                    content.items.push({
                        title: title ? title.textContent.trim() : '',
                        text: text ? text.textContent.trim() : ''
                    });
                });
                break;
        }
        
        return content;
    }

    /**
     * Get section type from element
     * @param {HTMLElement} section - Section element
     * @returns {string} Section type
     */
    getSectionType(section) {
        const classList = section.classList;
        
        if (classList.contains('summary-section')) return 'summary';
        if (classList.contains('skills-section')) return 'skills';
        if (classList.contains('experience-section')) return 'experience';
        if (classList.contains('education-section')) return 'education';
        if (classList.contains('certifications-section')) return 'certifications';
        if (classList.contains('additional-section')) return 'additional';
        
        return 'unknown';
    }

    /**
     * Render section to PDF
     * @param {jsPDF} pdf - PDF document
     * @param {Object} section - Section data
     * @param {number} startY - Starting Y position
     * @param {Object} pageFormat - Page format
     * @returns {number} Section height
     */
    async renderSection(pdf, section, startY, pageFormat) {
        let currentY = startY;
        const maxWidth = pageFormat.width - this.margins.left - this.margins.right;
        
        if (section.type === 'header') {
            currentY = await this.renderHeader(pdf, section.content, currentY, maxWidth);
        } else {
            currentY = await this.renderContentSection(pdf, section, currentY, maxWidth);
        }
        
        return currentY - startY;
    }

    /**
     * Render header section
     * @param {jsPDF} pdf - PDF document
     * @param {Object} content - Header content
     * @param {number} startY - Starting Y position
     * @param {number} maxWidth - Maximum width
     * @returns {number} End Y position
     */
    async renderHeader(pdf, content, startY, maxWidth) {
        let currentY = startY;
        
        // Name
        if (content.name) {
            pdf.setFontSize(24);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(37, 99, 235); // Primary color
            pdf.text(content.name, this.margins.left, currentY);
            currentY += 10;
        }
        
        // Job title
        if (content.jobTitle) {
            pdf.setFontSize(16);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(100, 116, 139); // Secondary color
            pdf.text(content.jobTitle, this.margins.left, currentY);
            currentY += 8;
        }
        
        // Contact information
        if (content.contact.length > 0) {
            currentY += 5;
            pdf.setFontSize(10);
            pdf.setTextColor(51, 51, 51); // Dark gray
            
            let contactY = currentY;
            let contactX = this.margins.left;
            
            content.contact.forEach((contact, index) => {
                const text = contact.text;
                const textWidth = pdf.getTextWidth(text);
                
                // Check if we need to wrap to next line
                if (contactX + textWidth > maxWidth + this.margins.left && index > 0) {
                    contactY += 5;
                    contactX = this.margins.left;
                }
                
                pdf.text(text, contactX, contactY);
                contactX += textWidth + 15; // Add spacing between items
            });
            
            currentY = contactY + 8;
        }
        
        // Add separator line
        pdf.setDrawColor(37, 99, 235);
        pdf.setLineWidth(0.5);
        pdf.line(this.margins.left, currentY, maxWidth + this.margins.left, currentY);
        currentY += 8;
        
        return currentY;
    }

    /**
     * Render content section
     * @param {jsPDF} pdf - PDF document
     * @param {Object} section - Section data
     * @param {number} startY - Starting Y position
     * @param {number} maxWidth - Maximum width
     * @returns {number} End Y position
     */
    async renderContentSection(pdf, section, startY, maxWidth) {
        let currentY = startY;
        
        // Section title
        if (section.content.title) {
            pdf.setFontSize(14);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(37, 99, 235); // Primary color
            pdf.text(section.content.title, this.margins.left, currentY);
            currentY += 8;
            
            // Underline
            pdf.setDrawColor(226, 232, 240);
            pdf.setLineWidth(0.2);
            pdf.line(this.margins.left, currentY - 2, maxWidth + this.margins.left, currentY - 2);
            currentY += 3;
        }
        
        // Section content
        switch (section.type) {
            case 'summary':
                currentY = this.renderSummaryContent(pdf, section.content, currentY, maxWidth);
                break;
            case 'skills':
                currentY = this.renderSkillsContent(pdf, section.content, currentY, maxWidth);
                break;
            case 'experience':
                currentY = this.renderExperienceContent(pdf, section.content, currentY, maxWidth);
                break;
            case 'education':
                currentY = this.renderEducationContent(pdf, section.content, currentY, maxWidth);
                break;
            case 'certifications':
                currentY = this.renderCertificationsContent(pdf, section.content, currentY, maxWidth);
                break;
            default:
                currentY = this.renderAdditionalContent(pdf, section.content, currentY, maxWidth);
                break;
        }
        
        return currentY + 5; // Add spacing after section
    }

    /**
     * Render summary content
     * @param {jsPDF} pdf - PDF document
     * @param {Object} content - Content data
     * @param {number} startY - Starting Y position
     * @param {number} maxWidth - Maximum width
     * @returns {number} End Y position
     */
    renderSummaryContent(pdf, content, startY, maxWidth) {
        if (!content.text) return startY;
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(51, 51, 51);
        
        const lines = pdf.splitTextToSize(content.text, maxWidth);
        pdf.text(lines, this.margins.left, startY);
        
        return startY + (lines.length * 4);
    }

    /**
     * Render skills content
     * @param {jsPDF} pdf - PDF document
     * @param {Object} content - Content data
     * @param {number} startY - Starting Y position
     * @param {number} maxWidth - Maximum width
     * @returns {number} End Y position
     */
    renderSkillsContent(pdf, content, startY, maxWidth) {
        let currentY = startY;
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(51, 51, 51);
        
        const itemsPerRow = 2;
        const itemWidth = maxWidth / itemsPerRow;
        
        content.items.forEach((skill, index) => {
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            const x = this.margins.left + (col * itemWidth);
            const y = currentY + (row * 8);
            
            // Skill name
            pdf.text(skill.name, x, y);
            
            // Skill level bar (simplified as text)
            const levelText = `(${skill.level})`;
            const nameWidth = pdf.getTextWidth(skill.name);
            pdf.setTextColor(100, 116, 139);
            pdf.text(levelText, x + nameWidth + 5, y);
            pdf.setTextColor(51, 51, 51);
        });
        
        const rows = Math.ceil(content.items.length / itemsPerRow);
        return currentY + (rows * 8);
    }

    /**
     * Render experience content
     * @param {jsPDF} pdf - PDF document
     * @param {Object} content - Content data
     * @param {number} startY - Starting Y position
     * @param {number} maxWidth - Maximum width
     * @returns {number} End Y position
     */
    renderExperienceContent(pdf, content, startY, maxWidth) {
        let currentY = startY;
        
        content.items.forEach(item => {
            // Job title and dates
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(51, 51, 51);
            pdf.text(item.title, this.margins.left, currentY);
            
            if (item.dates) {
                const datesWidth = pdf.getTextWidth(item.dates);
                pdf.setFont(undefined, 'normal');
                pdf.setTextColor(100, 116, 139);
                pdf.text(item.dates, maxWidth + this.margins.left - datesWidth, currentY);
            }
            
            currentY += 5;
            
            // Company
            if (item.company) {
                pdf.setFontSize(10);
                pdf.setFont(undefined, 'bold');
                pdf.setTextColor(100, 116, 139);
                pdf.text(item.company, this.margins.left, currentY);
                currentY += 5;
            }
            
            // Description
            if (item.description) {
                pdf.setFontSize(9);
                pdf.setFont(undefined, 'normal');
                pdf.setTextColor(85, 85, 85);
                
                const lines = pdf.splitTextToSize(item.description, maxWidth);
                pdf.text(lines, this.margins.left, currentY);
                currentY += lines.length * 3.5;
            }
            
            currentY += 3; // Space between items
        });
        
        return currentY;
    }

    /**
     * Render education content
     * @param {jsPDF} pdf - PDF document
     * @param {Object} content - Content data
     * @param {number} startY - Starting Y position
     * @param {number} maxWidth - Maximum width
     * @returns {number} End Y position
     */
    renderEducationContent(pdf, content, startY, maxWidth) {
        let currentY = startY;
        
        content.items.forEach(item => {
            // Degree
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(51, 51, 51);
            pdf.text(item.title, this.margins.left, currentY);
            currentY += 5;
            
            // Institution
            if (item.institution) {
                pdf.setFontSize(10);
                pdf.setFont(undefined, 'normal');
                pdf.setTextColor(100, 116, 139);
                pdf.text(item.institution, this.margins.left, currentY);
                currentY += 4;
            }
            
            // Details
            if (item.details) {
                pdf.setFontSize(9);
                pdf.setTextColor(100, 116, 139);
                pdf.text(item.details, this.margins.left, currentY);
                currentY += 4;
            }
            
            currentY += 3; // Space between items
        });
        
        return currentY;
    }

    /**
     * Render certifications content
     * @param {jsPDF} pdf - PDF document
     * @param {Object} content - Content data
     * @param {number} startY - Starting Y position
     * @param {number} maxWidth - Maximum width
     * @returns {number} End Y position
     */
    renderCertificationsContent(pdf, content, startY, maxWidth) {
        let currentY = startY;
        
        content.items.forEach(item => {
            // Certification name
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(51, 51, 51);
            pdf.text(item.title, this.margins.left, currentY);
            currentY += 4;
            
            // Details
            if (item.details) {
                pdf.setFontSize(9);
                pdf.setFont(undefined, 'normal');
                pdf.setTextColor(100, 116, 139);
                pdf.text(item.details, this.margins.left, currentY);
                currentY += 4;
            }
            
            currentY += 2; // Space between items
        });
        
        return currentY;
    }

    /**
     * Render additional content
     * @param {jsPDF} pdf - PDF document
     * @param {Object} content - Content data
     * @param {number} startY - Starting Y position
     * @param {number} maxWidth - Maximum width
     * @returns {number} End Y position
     */
    renderAdditionalContent(pdf, content, startY, maxWidth) {
        let currentY = startY;
        
        content.items.forEach(item => {
            // Item title
            if (item.title) {
                pdf.setFontSize(10);
                pdf.setFont(undefined, 'bold');
                pdf.setTextColor(51, 51, 51);
                pdf.text(item.title, this.margins.left, currentY);
                currentY += 4;
            }
            
            // Item text
            if (item.text) {
                pdf.setFontSize(9);
                pdf.setFont(undefined, 'normal');
                pdf.setTextColor(85, 85, 85);
                
                const lines = pdf.splitTextToSize(item.text, maxWidth);
                pdf.text(lines, this.margins.left, currentY);
                currentY += lines.length * 3.5;
            }
            
            currentY += 3; // Space between items
        });
        
        return currentY;
    }

    /**
     * Download PDF
     * @param {jsPDF} pdf - PDF document
     * @param {string} filename - File name
     */
    downloadPDF(pdf, filename = 'resume.pdf') {
        pdf.save(filename);
    }

    /**
     * Get PDF as blob
     * @param {jsPDF} pdf - PDF document
     * @returns {Blob} PDF blob
     */
    getPDFBlob(pdf) {
        return pdf.output('blob');
    }

    /**
     * Show loading indicator
     */
    showLoadingIndicator() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.querySelector('p').textContent = 'Generating PDF...';
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
     * Set page format
     * @param {string} format - Page format (A4 or Letter)
     */
    setPageFormat(format) {
        if (this.pageFormats[format]) {
            this.currentFormat = format;
        }
    }

    /**
     * Set margins
     * @param {Object} margins - Margin values in mm
     */
    setMargins(margins) {
        this.margins = { ...this.margins, ...margins };
    }

    /**
     * Get supported formats
     * @returns {Array} Supported formats
     */
    getSupportedFormats() {
        return Object.keys(this.pageFormats);
    }
}

// Export for use in other modules
window.PDFGenerator = PDFGenerator;