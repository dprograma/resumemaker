/**
 * Form Handler - Manages dynamic form system and user data
 * Handles form validation, auto-save, and data management
 */

class FormHandler {
    constructor() {
        this.formData = {
            personal: {
                fullName: '',
                jobTitle: '',
                email: '',
                phone: '',
                address: '',
                profilePhoto: null
            },
            summary: {
                text: ''
            },
            skills: [],
            experience: [],
            education: [],
            certifications: [],
            projects: [],
            additional: {
                languages: '',
                interests: '',
                references: ''
            }
        };
        
        this.autoSaveEnabled = true;
        this.autoSaveInterval = null;
        this.validationRules = this.initValidationRules();
        this.progressCalculator = new ProgressCalculator();
        this.cropper = null;
        
        this.init();
    }

    /**
     * Initialize form handler
     */
    init() {
        this.bindEvents();
        this.setupAutoSave();
        this.loadSavedData();
        this.updateProgress();
    }

    /**
     * Bind form events
     */
    bindEvents() {
        // Section toggle functionality
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.closest('.section-toggle')) return;
                this.toggleSection(header.closest('.form-section'));
            });
        });

        // Section toggle buttons
        document.querySelectorAll('.section-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSection(toggle.closest('.form-section'));
            });
        });

        // Form input events
        this.bindInputEvents();
        
        // Dynamic form events
        this.bindDynamicFormEvents();
        
        // Photo upload events
        this.bindPhotoEvents();
        
        // Character counter events
        this.bindCharacterCounters();
    }

    /**
     * Bind input events for form fields
     */
    bindInputEvents() {
        // Personal information
        const personalFields = ['fullName', 'jobTitle', 'email', 'phone', 'address'];
        personalFields.forEach(field => {
            const input = document.getElementById(field);
            if (input) {
                input.addEventListener('input', (e) => {
                    this.updateFormData('personal', field, e.target.value);
                    this.validateField(input);
                    this.updateProgress();
                });
                
                input.addEventListener('blur', (e) => {
                    this.validateField(input);
                });
            }
        });

        // Summary
        const summaryField = document.getElementById('summary');
        if (summaryField) {
            summaryField.addEventListener('input', (e) => {
                this.updateFormData('summary', 'text', e.target.value);
                this.updateProgress();
            });
        }

        // Additional fields
        const additionalFields = ['languages', 'interests', 'references'];
        additionalFields.forEach(field => {
            const input = document.getElementById(field);
            if (input) {
                input.addEventListener('input', (e) => {
                    this.updateFormData('additional', field, e.target.value);
                    this.updateProgress();
                });
            }
        });
    }

    /**
     * Bind dynamic form events (skills, experience, etc.)
     */
    bindDynamicFormEvents() {
        // Skills
        document.addEventListener('change', (e) => {
            if (e.target.matches('.skill-name, .skill-level')) {
                this.updateSkillsData();
                this.updateProgress();
            }
        });

        // Experience
        document.addEventListener('change', (e) => {
            if (e.target.matches('.job-title, .company-name, .start-date, .end-date, .job-description, .current-job')) {
                this.updateExperienceData();
                this.updateProgress();
            }
        });

        // Education
        document.addEventListener('change', (e) => {
            if (e.target.matches('.degree, .field-of-study, .institution, .graduation-year, .gpa')) {
                this.updateEducationData();
                this.updateProgress();
            }
        });

        // Certifications
        document.addEventListener('change', (e) => {
            if (e.target.matches('.cert-name, .cert-issuer, .cert-date')) {
                this.updateCertificationsData();
                this.updateProgress();
            }
        });

        // Projects
        document.addEventListener('change', (e) => {
            if (e.target.matches('.project-name, .project-description')) {
                this.updateProjectsData();
                this.updateProgress();
            }
        });

        // Languages
        const languagesContainer = document.getElementById('languages-container');
        if (languagesContainer) {
            languagesContainer.addEventListener('input', () => {
                this.updateLanguagesData();
                this.updateProgress();
            });
        }

        // Current job checkbox
        document.addEventListener('change', (e) => {
            if (e.target.matches('.current-job')) {
                const endDateInput = e.target.closest('.experience-item').querySelector('.end-date');
                if (e.target.checked) {
                    endDateInput.disabled = true;
                    endDateInput.value = '';
                } else {
                    endDateInput.disabled = false;
                }
                this.updateExperienceData();
            }
        });
    }

    /**
     * Bind photo upload events
     */
    bindPhotoEvents() {
        const photoInput = document.getElementById('profile-image-upload');
        const photoPlaceholder = document.getElementById('profile-image-placeholder');
        const profileImage = document.getElementById('profile-image');
        const removeProfileImage = document.getElementById('remove-profile-image');

        photoPlaceholder.addEventListener('click', () => photoInput.click());
        profileImage.addEventListener('click', () => photoInput.click());

        photoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    profileImage.src = event.target.result;
                    profileImage.style.display = 'block';
                    photoPlaceholder.style.display = 'none';
                    removeProfileImage.style.display = 'block';
                    this.formData.personal.profilePhoto = event.target.result;
                    this.saveData();
                };
                reader.readAsDataURL(file);
            }
        });

        removeProfileImage.addEventListener('click', () => {
            profileImage.src = '';
            profileImage.style.display = 'none';
            photoPlaceholder.style.display = 'block';
            removeProfileImage.style.display = 'none';
            this.formData.personal.profilePhoto = null;
            this.saveData();
        });
    }

    /**
     * Bind character counter events
     */
    bindCharacterCounters() {
        const summaryField = document.getElementById('summary');
        const summaryCounter = document.getElementById('summaryCount');

        if (summaryField && summaryCounter) {
            summaryField.addEventListener('input', () => {
                const count = summaryField.value.length;
                summaryCounter.textContent = count;
                
                if (count > 500) {
                    summaryCounter.style.color = 'var(--error-color)';
                } else if (count > 400) {
                    summaryCounter.style.color = 'var(--warning-color)';
                } else {
                    summaryCounter.style.color = 'var(--text-muted)';
                }
            });
        }
    }

    /**
     * Toggle form section
     * @param {HTMLElement} section - Section element
     */
    toggleSection(section) {
        const isActive = section.classList.contains('active');
        
        // Close all sections first (accordion behavior)
        document.querySelectorAll('.form-section').forEach(s => {
            s.classList.remove('active');
            s.querySelector('.section-header').setAttribute('aria-expanded', 'false');
        });
        
        // Open clicked section if it wasn't active
        if (!isActive) {
            section.classList.add('active');
            section.querySelector('.section-header').setAttribute('aria-expanded', 'true');
        }
    }

    /**
     * Update form data
     * @param {string} section - Section name
     * @param {string} field - Field name
     * @param {*} value - Field value
     */
    updateFormData(section, field, value) {
        if (!this.formData[section]) {
            this.formData[section] = {};
        }
        this.formData[section][field] = value;
        
        // Trigger auto-save
        if (this.autoSaveEnabled) {
            this.scheduleAutoSave();
        }
        
        // Trigger preview update
        this.triggerPreviewUpdate();
    }

    /**
     * Update skills data from form
     */
    updateSkillsData() {
        const skillItems = document.querySelectorAll('.skill-item');
        const skills = [];
        
        skillItems.forEach(item => {
            const name = item.querySelector('.skill-name').value.trim();
            const level = item.querySelector('.skill-level').value;
            
            if (name) {
                skills.push({ name, level });
            }
        });
        
        this.formData.skills = skills;
        this.scheduleAutoSave();
        this.triggerPreviewUpdate();
    }

    /**
     * Update experience data from form
     */
    updateExperienceData() {
        const experienceItems = document.querySelectorAll('.experience-item');
        const experience = [];
        
        experienceItems.forEach(item => {
            const jobTitle = item.querySelector('.job-title').value.trim();
            const company = item.querySelector('.company-name').value.trim();
            const startDate = item.querySelector('.start-date').value;
            const endDate = item.querySelector('.end-date').value;
            const description = item.querySelector('.job-description').value.trim();
            const isCurrent = item.querySelector('.current-job').checked;
            
            if (jobTitle || company) {
                experience.push({
                    jobTitle,
                    company,
                    startDate,
                    endDate: isCurrent ? 'Present' : endDate,
                    description,
                    isCurrent
                });
            }
        });
        
        this.formData.experience = experience;
        this.scheduleAutoSave();
        this.triggerPreviewUpdate();
    }

    /**
     * Update education data from form
     */
    updateEducationData() {
        const educationItems = document.querySelectorAll('.education-item');
        const education = [];
        
        educationItems.forEach(item => {
            const degree = item.querySelector('.degree').value.trim();
            const fieldOfStudy = item.querySelector('.field-of-study').value.trim();
            const institution = item.querySelector('.institution').value.trim();
            const graduationYear = item.querySelector('.graduation-year').value;
            const gpa = item.querySelector('.gpa').value.trim();
            
            if (degree || institution) {
                education.push({
                    degree,
                    fieldOfStudy,
                    institution,
                    graduationYear,
                    gpa
                });
            }
        });
        
        this.formData.education = education;
        this.scheduleAutoSave();
        this.triggerPreviewUpdate();
    }

    /**
     * Update certifications data from form
     */
    updateCertificationsData() {
        const certItems = document.querySelectorAll('.certification-item');
        const certifications = [];
        
        certItems.forEach(item => {
            const name = item.querySelector('.cert-name').value.trim();
            const issuer = item.querySelector('.cert-issuer').value.trim();
            const date = item.querySelector('.cert-date').value;
            
            if (name || issuer) {
                certifications.push({
                    name,
                    issuer,
                    date
                });
            }
        });
        
        this.formData.certifications = certifications;
        this.scheduleAutoSave();
        this.triggerPreviewUpdate();
    }

    updateProjectsData() {
        const projectItems = document.querySelectorAll('#projects-container .job');
        const projects = [];

        projectItems.forEach(item => {
            const name = item.querySelector('.job-title').textContent.trim();
            const description = item.querySelector('.job-description ul').innerHTML.trim();

            if (name) {
                projects.push({
                    name,
                    description
                });
            }
        });

        this.formData.projects = projects;
        this.scheduleAutoSave();
        this.triggerPreviewUpdate();
    }

    updateCertificationsData() {
        const certItems = document.querySelectorAll('#certifications-container .job');
        const certifications = [];

        certItems.forEach(item => {
            const name = item.querySelector('.job-title').textContent.trim();
            const issuer = item.querySelector('.company').textContent.trim();
            const date = item.querySelector('.job-details').textContent.trim();

            if (name || issuer) {
                certifications.push({
                    name,
                    issuer,
                    date
                });
            }
        });

        this.formData.certifications = certifications;
        this.scheduleAutoSave();
        this.triggerPreviewUpdate();
    }

    updateLanguagesData() {
        const languagesContainer = document.getElementById('languages-container');
        this.formData.additional.languages = languagesContainer.innerHTML;
        this.scheduleAutoSave();
        this.triggerPreviewUpdate();
    }

    /**
     * Handle photo upload
     * @param {File} file - Photo file
     */
    handlePhotoUpload(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            this.showError('Image file size must be less than 5MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.showPhotoCropModal(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    /**
     * Show photo crop modal
     * @param {string} imageSrc - Image source
     */
    showPhotoCropModal(imageSrc) {
        const modal = document.getElementById('photoCropModal');
        const image = document.getElementById('cropCanvas');
        image.src = imageSrc;
        
        modal.style.display = 'flex';
        
        if (this.cropper) {
            this.cropper.destroy();
        }
        
        this.cropper = new Cropper(image, {
            aspectRatio: 1,
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.8,
            restore: false,
            guides: false,
            center: false,
            highlight: false,
            cropBoxMovable: false,
            cropBoxResizable: false,
            toggleDragModeOnDblclick: false,
        });
    }

    /**
     * Apply photo crop
     */
    applyCrop() {
        const croppedCanvas = this.cropper.getCroppedCanvas({
            width: 200,
            height: 200,
            imageSmoothingQuality: 'high',
        });
        
        const croppedDataUrl = croppedCanvas.toDataURL('image/jpeg', 0.9);
        
        // Update preview
        const photoPreview = document.getElementById('photoPreview');
        photoPreview.innerHTML = `<img src="${croppedDataUrl}" alt="Profile Photo">`;
        photoPreview.classList.add('has-image');
        
        // Update form data
        this.updateFormData('personal', 'profilePhoto', croppedDataUrl);
        
        // Close modal
        this.closeCropModal();
    }

    /**
     * Close crop modal
     */
    closeCropModal() {
        const modal = document.getElementById('photoCropModal');
        modal.style.display = 'none';
        if (this.cropper) {
            this.cropper.destroy();
            this.cropper = null;
        }
    }

    /**
     * Initialize validation rules
     * @returns {Object} Validation rules
     */
    initValidationRules() {
        return {
            fullName: {
                required: true,
                minLength: 2,
                pattern: /^[a-zA-Z\s'-]+$/,
                message: 'Please enter a valid full name'
            },
            jobTitle: {
                required: true,
                minLength: 2,
                message: 'Please enter a job title'
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            phone: {
                required: true,
                pattern: /^[\+]?[1-9][\d]{0,15}$/,
                message: 'Please enter a valid phone number'
            }
        };
    }

    /**
     * Validate form field
     * @param {HTMLElement} field - Form field
     * @returns {boolean} Is valid
     */
    validateField(field) {
        const fieldName = field.name || field.id;
        const rules = this.validationRules[fieldName];
        
        if (!rules) return true;
        
        const value = field.value.trim();
        let isValid = true;
        let message = '';
        
        // Required validation
        if (rules.required && !value) {
            isValid = false;
            message = `${this.getFieldLabel(fieldName)} is required`;
        }
        
        // Min length validation
        if (isValid && rules.minLength && value.length < rules.minLength) {
            isValid = false;
            message = `${this.getFieldLabel(fieldName)} must be at least ${rules.minLength} characters`;
        }
        
        // Pattern validation
        if (isValid && rules.pattern && value && !rules.pattern.test(value)) {
            isValid = false;
            message = rules.message || `${this.getFieldLabel(fieldName)} format is invalid`;
        }
        
        // Update field appearance
        this.updateFieldValidation(field, isValid, message);
        
        return isValid;
    }

    /**
     * Update field validation appearance
     * @param {HTMLElement} field - Form field
     * @param {boolean} isValid - Is valid
     * @param {string} message - Error message
     */
    updateFieldValidation(field, isValid, message) {
        const formGroup = field.closest('.form-group');
        
        // Remove existing validation classes and messages
        formGroup.classList.remove('has-error', 'has-success');
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        if (!isValid) {
            formGroup.classList.add('has-error');
            const errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.textContent = message;
            formGroup.appendChild(errorElement);
        } else if (field.value.trim()) {
            formGroup.classList.add('has-success');
        }
    }

    /**
     * Get field label
     * @param {string} fieldName - Field name
     * @returns {string} Field label
     */
    getFieldLabel(fieldName) {
        const labels = {
            fullName: 'Full Name',
            jobTitle: 'Job Title',
            email: 'Email',
            phone: 'Phone'
        };
        return labels[fieldName] || fieldName;
    }

    /**
     * Setup auto-save functionality
     */
    setupAutoSave() {
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.toggleAutoSave();
            });
        }
    }

    /**
     * Toggle auto-save
     */
    toggleAutoSave() {
        this.autoSaveEnabled = !this.autoSaveEnabled;
        const saveBtn = document.getElementById('saveBtn');
        
        if (this.autoSaveEnabled) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Auto-Save: ON';
            saveBtn.classList.remove('btn-secondary');
            saveBtn.classList.add('btn-primary');
        } else {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Auto-Save: OFF';
            saveBtn.classList.remove('btn-primary');
            saveBtn.classList.add('btn-secondary');
            
            if (this.autoSaveInterval) {
                clearTimeout(this.autoSaveInterval);
            }
        }
    }

    /**
     * Schedule auto-save
     */
    scheduleAutoSave() {
        if (!this.autoSaveEnabled) return;
        
        if (this.autoSaveInterval) {
            clearTimeout(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setTimeout(() => {
            this.saveData();
        }, 2000); // Save after 2 seconds of inactivity
    }

    /**
     * Save form data to localStorage
     */
    saveData() {
        try {
            localStorage.setItem('resumeBuilderData', JSON.stringify(this.formData));
            this.showSaveIndicator();
        } catch (error) {
            console.error('Failed to save data:', error);
        }
    }

    /**
     * Load saved data from localStorage
     */
    loadSavedData() {
        try {
            const savedData = localStorage.getItem('resumeBuilderData');
            if (savedData) {
                this.formData = { ...this.formData, ...JSON.parse(savedData) };
                this.populateForm();
            }
        } catch (error) {
            console.error('Failed to load saved data:', error);
        }
    }

    /**
     * Populate form with saved data
     */
    populateForm() {
        // Personal information
        Object.keys(this.formData.personal).forEach(key => {
            const field = document.getElementById(key);
            if (field && this.formData.personal[key]) {
                field.value = this.formData.personal[key];
            }
        });

        // Profile photo
        if (this.formData.personal.profilePhoto) {
            const photoPreview = document.getElementById('photoPreview');
            photoPreview.innerHTML = `<img src="${this.formData.personal.profilePhoto}" alt="Profile Photo">`;
            photoPreview.classList.add('has-image');
        }

        // Summary
        const summaryField = document.getElementById('summary');
        if (summaryField && this.formData.summary.text) {
            summaryField.value = this.formData.summary.text;
        }

        // Additional fields
        Object.keys(this.formData.additional).forEach(key => {
            const field = document.getElementById(key);
            if (field && this.formData.additional[key]) {
                field.value = this.formData.additional[key];
            }
        });

        const languagesContainer = document.getElementById('languages-container');
        if (languagesContainer && this.formData.additional.languages) {
            languagesContainer.innerHTML = this.formData.additional.languages;
        }

        // Dynamic sections would need to be rebuilt
        this.rebuildDynamicSections();
    }

    /**
     * Rebuild dynamic sections from saved data
     */
    rebuildDynamicSections() {
        // Rebuild skills
        if (this.formData.skills.length > 0) {
            const container = document.getElementById('skillsContainer');
            container.innerHTML = '';
            this.formData.skills.forEach(skill => {
                this.addSkillItem(skill.name, skill.level);
            });
        }

        // Rebuild experience
        if (this.formData.experience.length > 0) {
            const container = document.getElementById('experienceContainer');
            container.innerHTML = '';
            this.formData.experience.forEach(exp => {
                this.addExperienceItem(exp);
            });
        }

        // Rebuild education
        if (this.formData.education.length > 0) {
            const container = document.getElementById('educationContainer');
            container.innerHTML = '';
            this.formData.education.forEach(edu => {
                this.addEducationItem(edu);
            });
        }

        // Rebuild certifications
        if (this.formData.certifications.length > 0) {
            const container = document.getElementById('certifications-container');
            container.innerHTML = '';
            this.formData.certifications.forEach(cert => {
                this.addCertificationItem(cert);
            });
        }

        // Rebuild projects
        if (this.formData.projects.length > 0) {
            const container = document.getElementById('projects-container');
            container.innerHTML = '';
            this.formData.projects.forEach(project => {
                this.addProjectItem(project);
            });
        }
    }

    /**
     * Add skill item to form
     * @param {string} name - Skill name
     * @param {string} level - Skill level
     */
    addSkillItem(name = '', level = 'intermediate') {
        const container = document.getElementById('skillsContainer');
        const skillItem = document.createElement('div');
        skillItem.className = 'skill-item';
        skillItem.innerHTML = `
            <div class="form-row">
                <div class="form-group">
                    <input type="text" placeholder="Skill name" class="skill-name" value="${name}">
                </div>
                <div class="form-group skill-level-group">
                    <select class="skill-level">
                        <option value="beginner" ${level === 'beginner' ? 'selected' : ''}>Beginner</option>
                        <option value="intermediate" ${level === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                        <option value="advanced" ${level === 'advanced' ? 'selected' : ''}>Advanced</option>
                        <option value="expert" ${level === 'expert' ? 'selected' : ''}>Expert</option>
                    </select>
                </div>
                <button type="button" class="btn-remove" onclick="removeSkill(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        container.appendChild(skillItem);
    }

    /**
     * Add experience item to form
     * @param {Object} exp - Experience data
     */
    addExperienceItem(exp = {}) {
        const container = document.getElementById('experienceContainer');
        const expItem = document.createElement('div');
        expItem.className = 'experience-item';
        expItem.innerHTML = `
            <div class="form-group">
                <label>Job Title</label>
                <input type="text" class="job-title" placeholder="e.g. Senior Software Engineer" value="${exp.jobTitle || ''}">
            </div>
            <div class="form-group">
                <label>Company</label>
                <input type="text" class="company-name" placeholder="Company name" value="${exp.company || ''}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="month" class="start-date" value="${exp.startDate || ''}">
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="month" class="end-date" value="${exp.endDate !== 'Present' ? exp.endDate || '' : ''}" ${exp.isCurrent ? 'disabled' : ''}>
                    <label class="checkbox-label">
                        <input type="checkbox" class="current-job" ${exp.isCurrent ? 'checked' : ''}> Current Position
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea class="job-description" rows="3" placeholder="Describe your responsibilities and achievements...">${exp.description || ''}</textarea>
            </div>
            <button type="button" class="btn-remove" onclick="removeExperience(this)">
                <i class="fas fa-times"></i> Remove
            </button>
        `;
        container.appendChild(expItem);
    }

    /**
     * Add education item to form
     * @param {Object} edu - Education data
     */
    addEducationItem(edu = {}) {
        const container = document.getElementById('educationContainer');
        const eduItem = document.createElement('div');
        eduItem.className = 'education-item';
        eduItem.innerHTML = `
            <div class="form-group">
                <label>Degree</label>
                <input type="text" class="degree" placeholder="e.g. Bachelor of Science" value="${edu.degree || ''}">
            </div>
            <div class="form-group">
                <label>Field of Study</label>
                <input type="text" class="field-of-study" placeholder="e.g. Computer Science" value="${edu.fieldOfStudy || ''}">
            </div>
            <div class="form-group">
                <label>Institution</label>
                <input type="text" class="institution" placeholder="University name" value="${edu.institution || ''}">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Graduation Year</label>
                    <input type="number" class="graduation-year" min="1950" max="2030" value="${edu.graduationYear || ''}">
                </div>
                <div class="form-group">
                    <label>GPA (Optional)</label>
                    <input type="text" class="gpa" placeholder="3.8/4.0" value="${edu.gpa || ''}">
                </div>
            </div>
            <button type="button" class="btn-remove" onclick="removeEducation(this)">
                <i class="fas fa-times"></i> Remove
            </button>
        `;
        container.appendChild(eduItem);
    }

    /**
     * Add certification item to form
     * @param {Object} cert - Certification data
     */
    addCertificationItem(cert = {}) {
        const container = document.getElementById('certifications-container');
        const certItem = document.createElement('div');
        certItem.className = 'job';
        certItem.innerHTML = `
            <div class="job-title" contenteditable="true"></div>
            <div class="company" contenteditable="true"></div>
            <div class="job-details" contenteditable="true"></div>
        `;
        container.appendChild(certItem);
    }

    addProjectItem(proj = {}) {
        const container = document.getElementById('projects-container');
        const projItem = document.createElement('div');
        projItem.className = 'job';
        projItem.innerHTML = `
            <div class="job-title" contenteditable="true"></div>
            <div class="job-description" contenteditable="true">
                <ul>
                    <li></li>
                </ul>
            </div>
        `;
        container.appendChild(projItem);
    }

    /**
     * Update progress indicator
     */
    updateProgress() {
        const progress = this.progressCalculator.calculate(this.formData);
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill && progressText) {
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${progress}% Complete`;
        }
    }

    /**
     * Show save indicator
     */
    showSaveIndicator() {
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved';
            saveBtn.style.background = 'var(--success-color)';
            
            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.style.background = '';
            }, 2000);
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Simple error display - could be enhanced with a toast system
        alert(message);
    }

    /**
     * Trigger preview update
     */
    triggerPreviewUpdate() {
        if (window.previewEngine) {
            window.previewEngine.updatePreview(this.formData);
        }
    }

    /**
     * Get form data
     * @returns {Object} Form data
     */
    getFormData() {
        return this.formData;
    }

    /**
     * Set form data
     * @param {Object} data - Form data
     */
    setFormData(data) {
        this.formData = { ...this.formData, ...data };
        this.populateForm();
        this.updateProgress();
        this.triggerPreviewUpdate();
    }

    /**
     * Clear all form data
     */
    clearFormData() {
        if (confirm('Are you sure you want to clear all fields and start over?')) {
            this.formData = {
                personal: { fullName: '', jobTitle: '', email: '', phone: '', address: '', profilePhoto: null },
                summary: { text: '' },
                skills: [],
                experience: [],
                education: [],
                certifications: [],
                additional: { languages: '', interests: '', references: '' }
            };
            
            localStorage.removeItem('resumeBuilderData');
            location.reload(); // Simple way to reset the form
        }
    }
}

/**
 * Progress Calculator - Calculates form completion progress
 */
class ProgressCalculator {
    calculate(formData) {
        let totalFields = 0;
        let completedFields = 0;
        
        // Personal information (weight: 30%)
        const personalFields = ['fullName', 'jobTitle', 'email', 'phone'];
        personalFields.forEach(field => {
            totalFields += 7.5; // 30% / 4 fields
            if (formData.personal[field] && formData.personal[field].trim()) {
                completedFields += 7.5;
            }
        });
        
        // Summary (weight: 10%)
        if (formData.summary.text && formData.summary.text.trim()) {
            completedFields += 10;
        }
        totalFields += 10;
        
        // Skills (weight: 15%)
        if (formData.skills.length > 0) {
            completedFields += 15;
        }
        totalFields += 15;
        
        // Experience (weight: 25%)
        if (formData.experience.length > 0) {
            const expWeight = 25 / Math.max(formData.experience.length, 1);
            formData.experience.forEach(exp => {
                if (exp.jobTitle && exp.company) {
                    completedFields += expWeight;
                }
            });
        }
        totalFields += 25;
        
        // Education (weight: 15%)
        if (formData.education.length > 0) {
            const eduWeight = 15 / Math.max(formData.education.length, 1);
            formData.education.forEach(edu => {
                if (edu.degree && edu.institution) {
                    completedFields += eduWeight;
                }
            });
        }
        totalFields += 15;
        
        // Additional fields (weight: 5%)
        const additionalFields = ['languages', 'interests', 'references'];
        const additionalWeight = 5 / additionalFields.length;
        additionalFields.forEach(field => {
            if (formData.additional[field] && formData.additional[field].trim()) {
                completedFields += additionalWeight;
            }
        });
        totalFields += 5;
        
        return Math.round((completedFields / totalFields) * 100);
    }
}

// Global functions for dynamic form management
window.addSkill = function() {
    if (window.formHandler) {
        window.formHandler.addSkillItem();
    }
};

window.removeSkill = function(button) {
    const skillItem = button.closest('.skill-item');
    skillItem.remove();
    if (window.formHandler) {
        window.formHandler.updateSkillsData();
    }
};

window.addExperience = function() {
    if (window.formHandler) {
        window.formHandler.addExperienceItem();
    }
};

window.removeExperience = function(button) {
    const expItem = button.closest('.experience-item');
    expItem.remove();
    if (window.formHandler) {
        window.formHandler.updateExperienceData();
    }
};

window.addEducation = function() {
    if (window.formHandler) {
        window.formHandler.addEducationItem();
    }
};

window.removeEducation = function(button) {
    const eduItem = button.closest('.education-item');
    eduItem.remove();
    if (window.formHandler) {
        window.formHandler.updateEducationData();
    }
};

window.addCertification = function() {
    if (window.formHandler) {
        window.formHandler.addCertificationItem();
    }
};

window.removeCertification = function(button) {
    const certItem = button.closest('.certification-item');
    certItem.remove();
    if (window.formHandler) {
        window.formHandler.updateCertificationsData();
    }
};

window.addProject = function() {
    if (window.formHandler) {
        window.formHandler.addProjectItem();
    }
};

window.removeProject = function(button) {
    const projItem = button.closest('.project-item');
    projItem.remove();
    if (window.formHandler) {
        window.formHandler.updateProjectsData();
    }
};

window.closeCropModal = function() {
    if (window.formHandler) {
        window.formHandler.closeCropModal();
    }
};

window.applyCrop = function() {
    if (window.formHandler) {
        window.formHandler.applyCrop();
    }
};

// Export for use in other modules
window.FormHandler = FormHandler;