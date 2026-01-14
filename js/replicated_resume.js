document.addEventListener('DOMContentLoaded', () => {
    const editModeCheckbox = document.getElementById('editMode');
    const downloadBtn = document.getElementById('downloadBtn');
    const resume = document.getElementById('resume');
    const photoUpload = document.getElementById('profile-image-upload');
    const photoPreview = document.getElementById('photoPreview');
    const profileImage = document.getElementById('profile-image');
    const placeholder = document.getElementById('profile-image-placeholder');
    const removeProfileImage = document.getElementById('remove-profile-image');

    function setEditable(isEditable) {
        const allEditableElements = resume.querySelectorAll('[contenteditable]');
        allEditableElements.forEach(el => {
            el.setAttribute('contenteditable', isEditable.toString());
        });

        if (isEditable) {
            resume.classList.add('edit-mode');
            downloadBtn.style.display = 'inline-block';
            updateRemoveButtonVisibility();
        } else {
            resume.classList.remove('edit-mode');
            downloadBtn.style.display = 'none';
            removeProfileImage.style.display = 'none';
        }
    }

    editModeCheckbox.addEventListener('change', (e) => {
        setEditable(e.target.checked);
    });

    downloadBtn.addEventListener('click', () => {
        const wasInEditMode = resume.classList.contains('edit-mode');
        if (wasInEditMode) {
            setEditable(false);
        }

        const element = document.getElementById('resume');

        // Get computed width to maintain content width
        const computedStyle = window.getComputedStyle(element);
        const contentWidth = element.offsetWidth - parseFloat(computedStyle.paddingLeft) - parseFloat(computedStyle.paddingRight);

        // Hide placeholder and header-right if no image
        const hasImage = photoPreview.classList.contains('has-image');
        const originalPlaceholderDisplay = placeholder.style.display;
        const originalHeaderRightDisplay = document.querySelector('.header-right').style.display;

        if (!hasImage) {
            placeholder.style.display = 'none';
            document.querySelector('.header-right').style.display = 'none';
        } else {
            placeholder.style.display = 'none'; // Always hide placeholder in PDF
        }

        // Temporarily adjust for PDF generation
        const originalPadding = element.style.padding;
        const originalWidth = element.style.width;
        element.style.padding = '0';
        element.style.width = contentWidth + 'px';

        const opt = {
            margin: [15, 15, 15, 15], // 15mm margins on all sides for each page
            filename: 'Kennedy_Egwuda_Resume.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                allowTaint: true,
                scrollY: 0,
                scrollX: 0
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait',
                compress: true
            },
            pagebreak: {
                mode: ['avoid-all', 'css', 'legacy'],
                before: '.page-break-before',
                after: '.page-break-after',
                avoid: ['.job', '.section', '.header']
            },
            enableLinks: true
        };

        html2pdf().from(element).set(opt).save().then(() => {
            // Restore original styles
            element.style.padding = originalPadding;
            element.style.width = originalWidth;
            placeholder.style.display = originalPlaceholderDisplay;
            document.querySelector('.header-right').style.display = originalHeaderRightDisplay;

            if (wasInEditMode) {
                setEditable(true);
            }
        });
    });

    // --- Profile Image Handling ---
    photoPreview.addEventListener('click', () => {
        if (editModeCheckbox.checked) {
            photoUpload.click();
        }
    });

    photoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                profileImage.src = event.target.result;
                profileImage.style.display = 'block';
                placeholder.style.display = 'none';
                if (editModeCheckbox.checked) {
                    removeProfileImage.style.display = 'block';
                }
                photoPreview.classList.add('has-image');
            };
            reader.readAsDataURL(file);
        }
    });

    removeProfileImage.addEventListener('click', (e) => {
        e.stopPropagation();
        profileImage.src = '';
        profileImage.style.display = 'none';
        placeholder.style.display = 'block';
        removeProfileImage.style.display = 'none';
        photoUpload.value = '';
        photoPreview.classList.remove('has-image');
    });

    // Update remove button visibility based on edit mode
    function updateRemoveButtonVisibility() {
        if (editModeCheckbox.checked && profileImage.style.display === 'block') {
            removeProfileImage.style.display = 'block';
        } else {
            removeProfileImage.style.display = 'none';
        }
    }


    // --- Dynamic Sections ---
    window.addExperience = function() {
        const container = document.getElementById('experience-container');
        const newItem = createNewItem('job', 'experience');
        container.appendChild(newItem);
    }

    window.addEducation = function() {
        const container = document.getElementById('education-container');
        const newItem = createNewItem('job', 'education');
        container.appendChild(newItem);
    }

    window.addProject = function() {
        const container = document.getElementById('projects-container');
        const newItem = createNewItem('job', 'project');
        container.appendChild(newItem);
    }

    window.addCertification = function() {
        const container = document.getElementById('certifications-container');
        const newItem = createNewItem('job', 'certification');
        container.appendChild(newItem);
    }

    function createNewItem(className, type) {
        const item = document.createElement('div');
        item.className = className;
        const isEditable = editModeCheckbox.checked;

        let content = '';
        switch(type) {
            case 'experience':
                content = `
                    <div class="job-title" contenteditable="true">New Job Title</div>
                    <div class="company" contenteditable="true">Company Name</div>
                    <div class="job-details" contenteditable="true">MM/YYYY - MM/YYYY | City, State</div>
                    <div class="job-description" contenteditable="true">
                        <ul>
                            <li>Describe your responsibilities and achievements.</li>
                        </ul>
                    </div>
                `;
                break;
            case 'education':
                content = `
                    <div class="job-title" contenteditable="true">Degree or Certificate</div>
                    <div class="company" contenteditable="true">Institution Name</div>
                    <div class="job-details" contenteditable="true">YYYY - YYYY | Location</div>
                `;
                break;
            case 'project':
                 content = `
                    <div class="job-title" contenteditable="true">Project Name</div>
                    <div class="job-description" contenteditable="true">
                        <ul>
                            <li>Describe the project and your role.</li>
                        </ul>
                    </div>
                `;
                break;
            case 'certification':
                content = `
                    <div class="job-title" contenteditable="true">Certification Name</div>
                    <div class="company" contenteditable="true">Issuing Organization</div>
                    <div class="job-details" contenteditable="true">Date Issued</div>
                `;
                break;
        }

        item.innerHTML = content;
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-remove';
        removeBtn.innerHTML = 'Remove';
        removeBtn.onclick = () => item.remove();
        item.appendChild(removeBtn);

        if (isEditable) {
            item.querySelectorAll('[contenteditable]').forEach(el => el.setAttribute('contenteditable', 'true'));
        }

        return item;
    }

    // --- Social Links Editing ---
    const githubLink = document.getElementById('github-link');
    const linkedinLink = document.getElementById('linkedin-link');
    const portfolioLink = document.getElementById('portfolio-link');

    function createLinkEditor(linkElement, defaultUrl) {
        linkElement.addEventListener('click', (e) => {
            if (editModeCheckbox.checked) {
                e.preventDefault();
                
                const input = document.createElement('input');
                input.type = 'url';
                input.value = linkElement.href;
                input.className = 'link-editor';
                input.style.cssText = `
                    width: 200px;
                    padding: 4px 8px;
                    border: 2px solid #3498db;
                    border-radius: 4px;
                    font-size: 10pt;
                    font-family: inherit;
                `;
                
                const originalText = linkElement.innerHTML;
                linkElement.style.display = 'none';
                linkElement.parentNode.insertBefore(input, linkElement);
                
                input.focus();
                input.select();
                
                function saveLink() {
                    const newUrl = input.value.trim();
                    if (newUrl && newUrl !== '') {
                        linkElement.href = newUrl;
                    }
                    input.remove();
                    linkElement.style.display = 'inline';
                }
                
                input.addEventListener('blur', saveLink);
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        saveLink();
                    }
                    if (e.key === 'Escape') {
                        input.remove();
                        linkElement.style.display = 'inline';
                    }
                });
            }
        });
    }

    createLinkEditor(githubLink, 'https://github.com/username');
    createLinkEditor(linkedinLink, 'https://linkedin.com/in/username');
    createLinkEditor(portfolioLink, 'https://portfolio-url.com');

    setEditable(false);
});
