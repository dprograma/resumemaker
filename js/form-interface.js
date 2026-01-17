// Form Interface Handler for Resume Builder
(function() {
    'use strict';

    // Skills array
    let skills = [];
    let experienceItems = [];
    let educationItems = [];
    let projectItems = [];

    // Initialize on DOM load
    document.addEventListener('DOMContentLoaded', function() {
        initializeFormInterface();
        setupModeToggle();
        loadExistingData();
    });

    function initializeFormInterface() {
        // Setup Skills Input
        const skillInput = document.getElementById('skillInput');
        if (skillInput) {
            skillInput.addEventListener('keypress', handleSkillInput);
        }

        // Setup all form inputs for real-time updates
        const formInputs = document.querySelectorAll('#formEditorPanel input, #formEditorPanel textarea');
        formInputs.forEach(input => {
            input.addEventListener('input', updatePreviewFromForm);
        });

        // Setup character counter for summary
        const summaryTextarea = document.getElementById('summary');
        if (summaryTextarea) {
            summaryTextarea.addEventListener('input', updateCharCounter);
        }
    }

    function setupModeToggle() {
        const modeToggle = document.getElementById('modeToggle');
        const formPanel = document.getElementById('formEditorPanel');
        const resumeContainer = document.getElementById('resume');

        if (modeToggle) {
            modeToggle.addEventListener('change', function() {
                const mode = this.value;

                switch(mode) {
                    case 'preview':
                        // Preview only mode
                        formPanel.style.display = 'none';
                        resumeContainer.style.display = 'block';
                        resumeContainer.classList.remove('edit-mode');
                        setAllContentEditable(false);
                        break;

                    case 'form':
                        // Form editor mode
                        formPanel.style.display = 'grid';
                        resumeContainer.style.display = 'none';
                        // Wait a moment for the DOM to be ready, then update preview
                        setTimeout(() => {
                            updatePreviewFromForm();
                        }, 100);
                        break;

                    case 'direct':
                        // Direct edit mode
                        formPanel.style.display = 'none';
                        resumeContainer.style.display = 'block';
                        resumeContainer.classList.add('edit-mode');
                        setAllContentEditable(true);
                        break;
                }
            });
        }
    }

    function setAllContentEditable(editable) {
        const resume = document.getElementById('resume');
        const editableElements = resume.querySelectorAll('[contenteditable]');
        editableElements.forEach(el => {
            el.setAttribute('contenteditable', editable.toString());
        });
    }

    function handleSkillInput(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const input = e.target;
            const skill = input.value.trim();

            if (skill && !skills.includes(skill)) {
                skills.push(skill);
                addSkillTag(skill);
                input.value = '';
                updatePreviewFromForm();
            }
        }
    }

    function addSkillTag(skill) {
        const container = document.getElementById('skillsTagsContainer');
        const tag = document.createElement('span');
        tag.className = 'skill-tag';
        tag.style.cssText = 'display: inline-block; background: #3498db; color: white; padding: 4px 10px; margin: 4px; border-radius: 4px; font-size: 11pt;';
        tag.innerHTML = `${skill} <span onclick="removeSkill('${skill}')" style="cursor: pointer; margin-left: 5px;">&times;</span>`;

        // Insert before the input
        const input = document.getElementById('skillInput');
        container.insertBefore(tag, input);
    }

    window.removeSkill = function(skill) {
        const index = skills.indexOf(skill);
        if (index > -1) {
            skills.splice(index, 1);
        }

        // Remove the tag from DOM
        const tags = document.querySelectorAll('.skill-tag');
        tags.forEach(tag => {
            if (tag.textContent.includes(skill)) {
                tag.remove();
            }
        });

        updatePreviewFromForm();
    };

    window.updateBulletCount = function(textarea) {
        const lines = textarea.value.split('\n').filter(line => line.trim());
        const count = lines.length;
        const countSpan = textarea.parentElement.querySelector('.bullet-count');
        if (countSpan) {
            countSpan.textContent = `${count} bullet point${count !== 1 ? 's' : ''}`;
            countSpan.style.fontWeight = count > 0 ? '600' : 'normal';
            countSpan.style.color = count > 0 ? '#2563eb' : '#64748b';
        }
    };

    window.toggleSection = function(header) {
        const section = header.parentElement;
        section.classList.toggle('active');
    };

    // Add Experience Form Item
    window.addExperienceFormItem = function() {
        const container = document.getElementById('experienceItemsContainer');
        const index = experienceItems.length;

        const item = document.createElement('div');
        item.className = 'experience-item';
        item.style.cssText = 'background: var(--background-color); border-radius: var(--radius-md); padding: var(--spacing-lg); margin-bottom: var(--spacing-md); position: relative;';
        item.innerHTML = `
            <button type="button" class="btn-remove" onclick="removeFormItem(this, ${index}, 'experience')" style="position: absolute; top: 8px; right: 8px; background: #ef4444; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Remove</button>
            <div class="form-group">
                <label>Job Title *</label>
                <input type="text" class="exp-title" placeholder="Senior Software Engineer" oninput="updatePreviewFromForm()">
            </div>
            <div class="form-group">
                <label>Company *</label>
                <input type="text" class="exp-company" placeholder="Company Name" oninput="updatePreviewFromForm()">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Start Date</label>
                    <input type="text" class="exp-start" placeholder="MM/YYYY" oninput="updatePreviewFromForm()">
                </div>
                <div class="form-group">
                    <label>End Date</label>
                    <input type="text" class="exp-end" placeholder="MM/YYYY or Present" oninput="updatePreviewFromForm()">
                </div>
            </div>
            <div class="form-group">
                <label>Location</label>
                <input type="text" class="exp-location" placeholder="City, State" oninput="updatePreviewFromForm()">
            </div>
            <div class="form-group">
                <label>Description (one bullet point per line)</label>
                <textarea class="exp-description" rows="4" placeholder="Achieved X by doing Y&#10;Developed features that improved Z&#10;Led team of N engineers&#10;&#10;Tip: Press Enter for new bullet point" oninput="updatePreviewFromForm(); updateBulletCount(this)"></textarea>
                <small style="color: #64748b; font-size: 12px; margin-top: 4px; display: block;">
                    Each line = 1 bullet point | <span class="bullet-count">0 bullet points</span>
                </small>
            </div>
        `;

        container.appendChild(item);
        experienceItems.push({});
    };

    // Add Education Form Item
    window.addEducationFormItem = function() {
        const container = document.getElementById('educationItemsContainer');
        const index = educationItems.length;

        const item = document.createElement('div');
        item.className = 'education-item';
        item.style.cssText = 'background: var(--background-color); border-radius: var(--radius-md); padding: var(--spacing-lg); margin-bottom: var(--spacing-md); position: relative;';
        item.innerHTML = `
            <button type="button" class="btn-remove" onclick="removeFormItem(this, ${index}, 'education')" style="position: absolute; top: 8px; right: 8px; background: #ef4444; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Remove</button>
            <div class="form-group">
                <label>Degree *</label>
                <input type="text" class="edu-degree" placeholder="B.Sc. in Computer Science" oninput="updatePreviewFromForm()">
            </div>
            <div class="form-group">
                <label>Institution *</label>
                <input type="text" class="edu-institution" placeholder="University Name" oninput="updatePreviewFromForm()">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Start Year</label>
                    <input type="text" class="edu-start" placeholder="2015" oninput="updatePreviewFromForm()">
                </div>
                <div class="form-group">
                    <label>End Year</label>
                    <input type="text" class="edu-end" placeholder="2019" oninput="updatePreviewFromForm()">
                </div>
            </div>
            <div class="form-group">
                <label>Location</label>
                <input type="text" class="edu-location" placeholder="City, State" oninput="updatePreviewFromForm()">
            </div>
        `;

        container.appendChild(item);
        educationItems.push({});
    };

    // Add Project Form Item
    window.addProjectFormItem = function() {
        const container = document.getElementById('projectsItemsContainer');
        const index = projectItems.length;

        const item = document.createElement('div');
        item.className = 'project-item';
        item.style.cssText = 'background: var(--background-color); border-radius: var(--radius-md); padding: var(--spacing-lg); margin-bottom: var(--spacing-md); position: relative;';
        item.innerHTML = `
            <button type="button" class="btn-remove" onclick="removeFormItem(this, ${index}, 'project')" style="position: absolute; top: 8px; right: 8px; background: #ef4444; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Remove</button>
            <div class="form-group">
                <label>Project Name *</label>
                <input type="text" class="proj-name" placeholder="E-commerce Platform" oninput="updatePreviewFromForm()">
            </div>
            <div class="form-group">
                <label>Description (one bullet point per line)</label>
                <textarea class="proj-description" rows="4" placeholder="Built a scalable platform using Django and React&#10;Implemented payment gateway integration&#10;Optimized database queries for better performance&#10;&#10;Tip: Press Enter for new bullet point" oninput="updatePreviewFromForm(); updateBulletCount(this)"></textarea>
                <small style="color: #64748b; font-size: 12px; margin-top: 4px; display: block;">
                    Each line = 1 bullet point | <span class="bullet-count">0 bullet points</span>
                </small>
            </div>
        `;

        container.appendChild(item);
        projectItems.push({});
    };

    window.removeFormItem = function(button, index, type) {
        button.parentElement.remove();
        if (type === 'experience') {
            experienceItems.splice(index, 1);
        } else if (type === 'education') {
            educationItems.splice(index, 1);
        } else if (type === 'project') {
            projectItems.splice(index, 1);
        }
        updatePreviewFromForm();
    };

    function updateCharCounter(e) {
        const textarea = e.target;
        const counter = document.getElementById('summaryCount');
        const count = textarea.value.length;
        if (counter) {
            counter.textContent = count;
            if (count > 500) {
                counter.style.color = '#ef4444';
            } else {
                counter.style.color = '#94a3b8';
            }
        }
    }

    function updatePreviewFromForm() {
        const preview = document.getElementById('resumePreview');
        const resume = document.getElementById('resume');

        if (!preview || !resume) {
            console.log('Preview or resume not found');
            return;
        }

        // Clone the resume template
        const clonedResume = resume.cloneNode(true);
        clonedResume.id = 'resumePreviewClone';
        clonedResume.style.display = 'block'; // Ensure it's visible

        // Update header information
        const fullName = document.getElementById('fullName')?.value || '';
        const jobTitle = document.getElementById('jobTitle')?.value || '';
        const email = document.getElementById('email')?.value || '';
        const phone = document.getElementById('phone')?.value || '';
        const location = document.getElementById('location')?.value || '';
        const github = document.getElementById('github')?.value || '';
        const linkedin = document.getElementById('linkedin')?.value || '';
        const portfolio = document.getElementById('portfolio')?.value || '';

        if (fullName) clonedResume.querySelector('#name').textContent = fullName.toUpperCase();
        if (jobTitle) clonedResume.querySelector('#title').textContent = jobTitle;
        if (email) clonedResume.querySelector('#email').innerHTML = `<i class="fas fa-envelope"></i> ${email}`;
        if (phone) clonedResume.querySelector('#phone').innerHTML = `<i class="fas fa-phone-alt"></i> ${phone}`;
        if (location) clonedResume.querySelector('#location').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${location}`;

        // Update social links
        if (github) clonedResume.querySelector('#github-link').href = github;
        if (linkedin) clonedResume.querySelector('#linkedin-link').href = linkedin;
        if (portfolio) clonedResume.querySelector('#portfolio-link').href = portfolio;

        // Update summary
        const summary = document.getElementById('summary')?.value || '';
        if (summary) clonedResume.querySelector('#summary').textContent = summary;

        // Update strengths and achievements
        const strengths = document.getElementById('strengths')?.value || '';
        const achievements = document.getElementById('achievements')?.value || '';
        if (strengths) clonedResume.querySelector('#strengths').innerHTML = `<i class="fas fa-lightbulb"></i> <strong>Leadership and Soft Skills:</strong> ${strengths}`;
        if (achievements) clonedResume.querySelector('#achievements').innerHTML = `<i class="fas fa-star"></i> <strong>Operational Efficiency Improvement:</strong> ${achievements}`;

        // Update skills
        const skillsContainer = clonedResume.querySelector('#skills');
        skillsContainer.innerHTML = '';
        skills.forEach(skill => {
            const tag = document.createElement('span');
            tag.className = 'skill-tag';
            tag.textContent = skill;
            skillsContainer.appendChild(tag);
        });

        // Update experience
        const experienceContainer = clonedResume.querySelector('#experience-container');
        experienceContainer.innerHTML = '';
        document.querySelectorAll('.experience-item').forEach(item => {
            const title = item.querySelector('.exp-title')?.value || '';
            const company = item.querySelector('.exp-company')?.value || '';
            const start = item.querySelector('.exp-start')?.value || '';
            const end = item.querySelector('.exp-end')?.value || '';
            const loc = item.querySelector('.exp-location')?.value || '';
            const desc = item.querySelector('.exp-description')?.value || '';

            if (title || company) {
                const expDiv = document.createElement('div');
                expDiv.className = 'job';
                expDiv.innerHTML = `
                    <div class="job-title">${title}</div>
                    <div class="company">${company}</div>
                    <div class="job-details">${start}${end ? ' - ' + end : ''}${loc ? ' | ' + loc : ''}</div>
                    <div class="job-description">
                        <ul>
                            ${desc.split('\n').filter(line => line.trim()).map(line => `<li>${line.replace(/^[•\-\*]\s*/, '')}</li>`).join('')}
                        </ul>
                    </div>
                `;
                experienceContainer.appendChild(expDiv);
            }
        });

        // Update education
        const educationContainer = clonedResume.querySelector('#education-container');
        educationContainer.innerHTML = '';
        document.querySelectorAll('.education-item').forEach(item => {
            const degree = item.querySelector('.edu-degree')?.value || '';
            const institution = item.querySelector('.edu-institution')?.value || '';
            const start = item.querySelector('.edu-start')?.value || '';
            const end = item.querySelector('.edu-end')?.value || '';
            const loc = item.querySelector('.edu-location')?.value || '';

            if (degree || institution) {
                const eduDiv = document.createElement('div');
                eduDiv.className = 'job';
                eduDiv.innerHTML = `
                    <div class="job-title">${degree}</div>
                    <div class="company">${institution}</div>
                    <div class="job-details">${start}${end ? ' - ' + end : ''}${loc ? ' | ' + loc : ''}</div>
                `;
                educationContainer.appendChild(eduDiv);
            }
        });

        // Update projects
        const projectsContainer = clonedResume.querySelector('#projects-container');
        projectsContainer.innerHTML = '';
        document.querySelectorAll('.project-item').forEach(item => {
            const name = item.querySelector('.proj-name')?.value || '';
            const desc = item.querySelector('.proj-description')?.value || '';

            if (name) {
                const projDiv = document.createElement('div');
                projDiv.className = 'job';
                projDiv.innerHTML = `
                    <div class="job-title">${name}</div>
                    <div class="job-description">
                        <ul>
                            ${desc.split('\n').filter(line => line.trim()).map(line => `<li>${line.replace(/^[•\-\*]\s*/, '')}</li>`).join('')}
                        </ul>
                    </div>
                `;
                projectsContainer.appendChild(projDiv);
            }
        });

        // Update languages
        const languagesText = document.getElementById('languages')?.value || '';
        if (languagesText) {
            const languagesContainer = clonedResume.querySelector('#languages-container');
            languagesContainer.innerHTML = '';
            const langs = languagesText.split('\n').filter(l => l.trim());
            langs.forEach(lang => {
                const parts = lang.split('(');
                const langName = parts[0].trim();
                const proficiency = parts[1] ? parts[1].replace(')', '').trim() : '';

                const langDiv = document.createElement('div');
                langDiv.style.marginBottom = '12px';
                langDiv.innerHTML = `
                    <div style="font-weight: 600; color: #2c3e50; margin-bottom: 4px;">${langName}</div>
                    ${proficiency ? `<div style="font-size: 9pt; color: #7f8c8d;">${proficiency}</div>` : ''}
                `;
                languagesContainer.appendChild(langDiv);
            });
        }

        // Hide remove buttons in preview
        clonedResume.querySelectorAll('.btn-remove, .btn-add').forEach(btn => btn.style.display = 'none');

        // Make all elements non-editable
        clonedResume.querySelectorAll('[contenteditable]').forEach(el => {
            el.setAttribute('contenteditable', 'false');
        });

        // Replace preview content
        preview.innerHTML = '';
        preview.appendChild(clonedResume);

        // Update progress
        updateProgress();
    }

    function updateProgress() {
        const fields = [
            document.getElementById('fullName')?.value,
            document.getElementById('jobTitle')?.value,
            document.getElementById('email')?.value,
            document.getElementById('summary')?.value,
            skills.length > 0,
            experienceItems.length > 0,
            educationItems.length > 0
        ];

        const filledFields = fields.filter(f => f).length;
        const percentage = Math.round((filledFields / fields.length) * 100);

        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progressFill) progressFill.style.width = percentage + '%';
        if (progressText) progressText.textContent = percentage + '%';
    }

    function loadExistingData() {
        // Load data from the existing resume
        const resume = document.getElementById('resume');
        if (!resume) return;

        // Load personal info - extract text after icons
        const name = resume.querySelector('#name')?.textContent?.trim() || '';
        const title = resume.querySelector('#title')?.textContent?.trim() || '';

        // For email and phone, get text content and clean it
        const emailEl = resume.querySelector('#email');
        const email = emailEl ? emailEl.textContent.replace(/\s+/g, ' ').trim().split(' ').pop() : '';

        const phoneEl = resume.querySelector('#phone');
        const phone = phoneEl ? phoneEl.textContent.replace(/\s+/g, ' ').trim().split(' ').filter(p => p.match(/[\d+]/)).join(' ') : '';

        const locationEl = resume.querySelector('#location');
        const location = locationEl ? locationEl.textContent.replace(/\s+/g, ' ').trim().split(' ').slice(1).join(' ') : '';

        // Get social links
        const githubLink = resume.querySelector('#github-link')?.href || '';
        const linkedinLink = resume.querySelector('#linkedin-link')?.href || '';
        const portfolioLink = resume.querySelector('#portfolio-link')?.href || '';

        // Populate form fields
        if (name) document.getElementById('fullName').value = name;
        if (title) document.getElementById('jobTitle').value = title;
        if (email) document.getElementById('email').value = email;
        if (phone) document.getElementById('phone').value = phone;
        if (location) document.getElementById('location').value = location;
        if (githubLink) document.getElementById('github').value = githubLink;
        if (linkedinLink) document.getElementById('linkedin').value = linkedinLink;
        if (portfolioLink) document.getElementById('portfolio').value = portfolioLink;

        // Load summary
        const summary = resume.querySelector('#summary')?.textContent?.trim() || '';
        if (summary) document.getElementById('summary').value = summary;

        // Load strengths and achievements
        const strengthsEl = resume.querySelector('#strengths');
        const achievementsEl = resume.querySelector('#achievements');
        if (strengthsEl) {
            const strengthsText = strengthsEl.textContent.replace(/.*?:\s*/, '').trim();
            document.getElementById('strengths').value = strengthsText;
        }
        if (achievementsEl) {
            const achievementsText = achievementsEl.textContent.replace(/.*?:\s*/, '').trim();
            document.getElementById('achievements').value = achievementsText;
        }

        // Load skills
        const skillTags = resume.querySelectorAll('#skills .skill-tag');
        skillTags.forEach(tag => {
            const skill = tag.textContent.trim();
            if (skill && !skills.includes(skill)) {
                skills.push(skill);
                addSkillTag(skill);
            }
        });

        // Load existing experience with data
        const existingExperience = resume.querySelectorAll('#experience-container .job');
        existingExperience.forEach((job, index) => {
            window.addExperienceFormItem();

            // Populate the form item with data
            const items = document.querySelectorAll('.experience-item');
            const formItem = items[items.length - 1];

            if (formItem) {
                const jobTitle = job.querySelector('.job-title')?.textContent?.trim() || '';
                const company = job.querySelector('.company')?.textContent?.trim() || '';
                const details = job.querySelector('.job-details')?.textContent?.trim() || '';
                const descEl = job.querySelector('.job-description');

                formItem.querySelector('.exp-title').value = jobTitle;
                formItem.querySelector('.exp-company').value = company;

                // Parse job details (e.g., "06/2022 - Present | Lekki, Lagos")
                if (details) {
                    const parts = details.split('|');
                    const dates = parts[0]?.trim() || '';
                    const loc = parts[1]?.trim() || '';

                    const dateParts = dates.split('-');
                    formItem.querySelector('.exp-start').value = dateParts[0]?.trim() || '';
                    formItem.querySelector('.exp-end').value = dateParts[1]?.trim() || '';
                    formItem.querySelector('.exp-location').value = loc;
                }

                // Get description from list items
                if (descEl) {
                    const listItems = descEl.querySelectorAll('li');
                    const description = Array.from(listItems).map(li => li.textContent.trim()).join('\n');
                    formItem.querySelector('.exp-description').value = description;
                }
            }
        });

        // Load existing education with data
        const existingEducation = resume.querySelectorAll('#education-container .job');
        existingEducation.forEach((edu) => {
            window.addEducationFormItem();

            const items = document.querySelectorAll('.education-item');
            const formItem = items[items.length - 1];

            if (formItem) {
                const degree = edu.querySelector('.job-title')?.textContent?.trim() || '';
                const institution = edu.querySelector('.company')?.textContent?.trim() || '';
                const details = edu.querySelector('.job-details')?.textContent?.trim() || '';

                formItem.querySelector('.edu-degree').value = degree;
                formItem.querySelector('.edu-institution').value = institution;

                // Parse details (e.g., "2015 - 2019 | Akoka, Lagos")
                if (details) {
                    const parts = details.split('|');
                    const years = parts[0]?.trim() || '';
                    const loc = parts[1]?.trim() || '';

                    const yearParts = years.split('-');
                    formItem.querySelector('.edu-start').value = yearParts[0]?.trim() || '';
                    formItem.querySelector('.edu-end').value = yearParts[1]?.trim() || '';
                    formItem.querySelector('.edu-location').value = loc;
                }
            }
        });

        // Load existing projects with data
        const existingProjects = resume.querySelectorAll('#projects-container .job');
        existingProjects.forEach((proj) => {
            window.addProjectFormItem();

            const items = document.querySelectorAll('.project-item');
            const formItem = items[items.length - 1];

            if (formItem) {
                const projName = proj.querySelector('.job-title')?.textContent?.trim() || '';
                const descEl = proj.querySelector('.job-description');

                formItem.querySelector('.proj-name').value = projName;

                if (descEl) {
                    const listItems = descEl.querySelectorAll('li');
                    const description = Array.from(listItems).map(li => li.textContent.trim()).join('\n');
                    formItem.querySelector('.proj-description').value = description;
                }
            }
        });

        // Load languages
        const languagesContainer = resume.querySelector('#languages-container');
        if (languagesContainer) {
            const langDivs = languagesContainer.querySelectorAll('div[style*="margin-bottom"]');
            const languagesArray = [];

            langDivs.forEach(div => {
                const langName = div.querySelector('div[style*="font-weight"]')?.textContent?.trim() || '';
                const proficiency = div.querySelector('div[style*="font-size: 9pt"]')?.textContent?.trim() || '';

                if (langName) {
                    languagesArray.push(proficiency ? `${langName} (${proficiency})` : langName);
                }
            });

            document.getElementById('languages').value = languagesArray.join('\n');
        }

        // Update character counter
        updateCharCounter({ target: document.getElementById('summary') });
    }

})();
