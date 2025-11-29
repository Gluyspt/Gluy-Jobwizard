document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    const API_BASE_URL = "https://teaching.cmkl.ai/api";

    // Login page
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('email');
            const emailValue = emailInput.value;
            const messageSpan = document.getElementById('loginMessage');
            const submitBtn = document.querySelector('.login-btn');

            // Reset UI
            if (messageSpan) {
                messageSpan.className = "status-message";
            }
            submitBtn.disabled = true;

            try {
                const response = await fetch(`${API_BASE_URL}/search/applied?email=${encodeURIComponent(emailValue)}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                const data = await response.json();

                if (response.ok) {
                    if (messageSpan) messageSpan.textContent = "";
                    sessionStorage.setItem('currentUserEmail', emailValue);
                    sessionStorage.setItem('appliedJobsData', JSON.stringify(data));
                    window.location.href = "jobs_applied.html"; 
                } else {
                    const errorText = data.error || "Login failed. User not found.";
                    if (messageSpan) {
                        messageSpan.textContent = errorText;
                        messageSpan.classList.add("error");
                    }
                }

            } catch (error) {
                console.error("Login error:", error);
                if (messageSpan) {
                    messageSpan.textContent = "Network Error";
                    messageSpan.classList.add("error");
                }
            } finally {
                submitBtn.disabled = false;
            }
        });

        const registerBtn = document.getElementById('registerBtn');
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                window.location.href = "register.html";
            });
        }
    }

    // Register page
    if (registerForm) {
        setupValidation();
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const messageSpan = document.getElementById('registerMessage');
            const submitBtn = document.querySelector('.register-bnt');

            if (messageSpan) {
            messageSpan.className = "status-message";
            }
            submitBtn.disabled = true;

            const educationMap = {
                "none": 0,
                "high-school": 1,
                "bachelor": 2,
                "master": 3,
                "doctoral": 4
            };
            const educationVal = document.getElementById('education').value;

            const payload = {
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                first: document.getElementById('first-name').value,
                last: document.getElementById('last-name').value,
                education: educationMap[educationVal] || 0
            };

            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (data.registered) {
                    window.location.href = "index.html";
                } else if (data.error) {
                    messageSpan.textContent = "Error: " + data.error;
                    messageSpan.classList.add("error");
                } else {
                    messageSpan.textContent = "Error";
                    messageSpan.classList.add("error");
                }

            } catch (error) {
                console.error("Registration failed:", error);
                messageSpan.textContent = error;
                messageSpan.classList.add("error");
            } finally {
                submitBtn.disabled = false;
            }
        });

        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = "index.html";
            });
        }
    }
});

// Helper function, show error text registering
function updateInputStatus(element, isValid, errorMessage) {
    const errorText = element.parentElement.querySelector('.field-error');

    if (isValid || element.value === "") {
        if (errorText) {
            errorText.textContent = "";
            errorText.classList.remove('active');
        }
    } else {
        if (errorText) {
            errorText.textContent = errorMessage;
            errorText.classList.add('active');
        }
    }
}

function setupValidation() {
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');

    emailInput.addEventListener('input', () => {
        const value = emailInput.value;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|cmkl\.ac\.th|[\w-]+\.ac\.th|[\w-]+\.com)$/;
        const isValid = emailRegex.test(value);
        updateInputStatus(emailInput, isValid, "Invalid email format");
    });

    phoneInput.addEventListener('input', () => {
        const value = phoneInput.value;
        const isValid = /^0\d{9}$/.test(value);
        updateInputStatus(phoneInput, isValid, "Must be 10 digits starting with 0");
    });

    firstNameInput.addEventListener('input', () => {
        const value = firstNameInput.value;
        const isValid = /^[A-Za-z]+$/.test(value);
        updateInputStatus(firstNameInput, isValid, "No spaces or numbers allowed");
    });

    lastNameInput.addEventListener('input', () => {
        const value = lastNameInput.value;
        const isValid = /^[A-Za-z]+$/.test(value);
        updateInputStatus(lastNameInput, isValid, "No spaces or numbers allowed");
    });
}



const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.clear();
        window.location.href = "index.html";
    });
}

// Jobs applied page
const jobListContainer = document.getElementById('jobListContainer');

if (jobListContainer) {
    const userEmail = sessionStorage.getItem('currentUserEmail');

    if (userEmail) {
        fetchAppliedJobs(userEmail);
    } else {
        jobListContainer.innerHTML = '<p style="text-align:center; color:red;">Please log in to view data.</p>';
    }

    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            performGeneralSearch(userEmail);
        });
    }
}

// Fetch Jobs User Applied For
async function fetchAppliedJobs(email) {
    jobListContainer.innerHTML = '<p style="text-align:center; padding:20px;">Loading your applications...</p>';
    
    try {
        const response = await fetch(`https://teaching.cmkl.ai/api/search/applied?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        renderJobs(data, "You haven't applied to any jobs yet.");
        
    } catch (error) {
        console.error("Error loading applied jobs:", error);
        jobListContainer.innerHTML = '<p style="text-align:center; color:red;">Network Error</p>';
    }
}

// Render Cards
function renderJobs(jobs, emptyMessage) {
    jobListContainer.innerHTML = '';

    if (!Array.isArray(jobs) || jobs.length === 0) {
        jobListContainer.innerHTML = `<p style="text-align:center;">${emptyMessage}</p>`;
        return;
    }

    jobs.forEach(job => {
        const statusClass = job.is_open ? 'status-open' : 'status-closed';
        const statusText = job.is_open ? 'open' : 'close';

        const cardHTML = `
            <div class="job-card">
                <div class="job-info">
                    <h2>${job.title}</h2>
                    <div class="job-meta">
                        <span class="job-id">ID: ${job.job_id}</span>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                        <span>Posted: ${job.date_posted}</span>
                    </div>
                </div>
                <button class="details-btn" onclick="viewDetails('${job.job_id}')">Details</button>
            </div>
        `;
        jobListContainer.innerHTML += cardHTML;
    });
}


// FindJob page
const findJobListContainer = document.getElementById('findJobListContainer');

if (findJobListContainer) {
    const userEmail = sessionStorage.getItem('currentUserEmail');

    if (userEmail) {
        const savedKeyword = sessionStorage.getItem('filter_keyword');
        const savedDate = sessionStorage.getItem('filter_date');
        const savedEdu = sessionStorage.getItem('filter_edu');
        const savedSalary = sessionStorage.getItem('filter_salary');
        const savedExp = sessionStorage.getItem('filter_exp');

        // Put values back into the boxes
        if (savedKeyword !== null) document.getElementById('filterTitle').value = savedKeyword;
        if (savedDate !== null) document.getElementById('filterDate').value = savedDate;
        if (savedEdu !== null) document.getElementById('educationFilter').value = savedEdu;
        if (savedSalary !== null) document.getElementById('filterSalary').value = savedSalary;
        if (savedExp !== null) document.getElementById('filterExperience').value = savedExp;

        performGeneralSearch(userEmail);
    } else {
        findJobListContainer.innerHTML = '<p style="text-align:center; color:red;">Please log in to view jobs.</p>';
    }

    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            performGeneralSearch(userEmail);
        });
    }
}


async function performGeneralSearch(email) {
    const keyword = document.getElementById('filterTitle').value.trim();
    const datePosted = document.getElementById('filterDate').value;
    const education = document.getElementById('educationFilter').value;
    const salary = document.getElementById('filterSalary').value.trim();
    const experience = document.getElementById('filterExperience').value.trim();

    sessionStorage.setItem('filter_keyword', keyword);
    sessionStorage.setItem('filter_date', datePosted);
    sessionStorage.setItem('filter_edu', education);
    sessionStorage.setItem('filter_salary', salary);
    sessionStorage.setItem('filter_exp', experience);

    const params = new URLSearchParams();
    params.append('email', email);

    if (keyword) params.append('keyword', keyword);
    if (datePosted) params.append('posted', datePosted);
    if (education) params.append('education', education);
    if (salary) params.append('salary', salary);
    if (experience) params.append('experience', experience);

    const container = document.getElementById('findJobListContainer');
    container.innerHTML = '<p style="text-align:center; padding:20px;">Searching...</p>';

    try {
        const response = await fetch(`https://teaching.cmkl.ai/api/search?${params.toString()}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        
        if (data.warning) {
            container.innerHTML = `<p style="text-align:center;">${data.warning}</p>`;
        } else if (Array.isArray(data)) {
            renderFindJobs(data, container);
        } else {
            container.innerHTML = '<p style="text-align:center; color:red;">Error fetching jobs.</p>';
        }

    } catch (error) {
        console.error("Search error:", error);
        container.innerHTML = '<p style="text-align:center; color:red;">Network Error</p>';
    }
}

function renderFindJobs(jobs, container) {
    container.innerHTML = ''; 

    if (jobs.length === 0) {
        container.innerHTML = `<p style="text-align:center;">No matching jobs found.</p>`;
        return;
    }

    jobs.forEach(job => {
        const statusClass = job.is_open ? 'status-open' : 'status-closed';
        const statusText = job.is_open ? 'open' : 'close';

        const cardHTML = `
            <div class="job-card">
                <div class="job-info">
                    <h2>${job.title}</h2>
                    <div class="job-meta">
                        <span class="job-id">ID: ${job.job_id}</span>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                        <span>Posted: ${job.date_posted}</span>
                    </div>
                </div>
                <button class="apply-btn" onclick="applyJob('${job.job_id}')">Apply</button>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}


// Job detail
function viewDetails(jobId) {
    window.location.href = `job_details.html?id=${jobId}`;
}

const detailCard = document.getElementById('detailCard');

if (detailCard) {
    const userEmail = sessionStorage.getItem('currentUserEmail');
    
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('id');

    if (userEmail && jobId) {
        fetchJobDetails(userEmail, jobId);
    } else {
        document.getElementById('loadingText').textContent = "Error: Missing Job ID or Login";
    }
}

async function fetchJobDetails(email, jobId) {
    try {
        const response = await fetch(`https://teaching.cmkl.ai/api/search/detail?email=${encodeURIComponent(email)}&job_id=${jobId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const job = await response.json();

        // Check for error
        if (job.error) {
            document.getElementById('loadingText').textContent = "Error: " + job.error;
            return;
        }

        const eduMap = ["None", "High School", "Bachelor's Degree", "Master's Degree", "Doctoral's Degree"];
        const eduText = eduMap[job.min_education] || "Unknown";

        // Hide Loading, Show Content
        document.getElementById('loadingText').style.display = 'none';
        document.getElementById('jobContent').style.display = 'block';

        // Fill Data
        document.getElementById('detailTitle').textContent = `Job Title: ${job.title}`;
        document.getElementById('detailID').textContent = `ID: ${job.job_id}`;
        
        // Status Badge Logic
        const statusSpan = document.getElementById('detailStatus');
        statusSpan.textContent = `${job.is_open ? 'open' : 'closed'}`;
        statusSpan.className = `detail-badge ${job.is_open ? 'status-open' : 'status-closed'}`;

        document.getElementById('detailDate').innerHTML = `<strong>Date Posted:</strong> ${job.date_posted}`;
        document.getElementById('detailDesc').textContent = job.description;
        document.getElementById('detailSalary').textContent = job.salary.toLocaleString(); // Add commas
        document.getElementById('detailEdu').textContent = eduText;
        document.getElementById('detailExp').textContent = job.min_experience;
        document.getElementById('detailCreator').textContent = job.creator;

    } catch (error) {
        console.error("Detail fetch error:", error);
        document.getElementById('loadingText').textContent = "Network Error";
    }
}



function applyJob(jobId) {
    window.location.href = `apply_job.html?id=${jobId}`;
}

// apply job
const confirmBtn = document.getElementById('confirmBtn');

if (confirmBtn) {
    const userEmail = sessionStorage.getItem('currentUserEmail');
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('id');

    if (userEmail && jobId) {
        fetchJobDetails(userEmail, jobId);
    }

    confirmBtn.addEventListener('click', () => {
        submitApplication(userEmail, jobId);
    });
}

async function submitApplication(email, jobId) {
    const btn = document.getElementById('confirmBtn');
    const msg = document.getElementById('applyMessage');
    // Disable button to prevent double-clicks
    btn.disabled = true;
    btn.textContent = "Submitting...";
    btn.style.backgroundColor = "#ccc"; // Visual feedback

    if (msg) {
        msg.textContent = "Submitting...";
        msg.className = "status-message info";
    }

    const payload = {
        email: email,
        job_id: jobId
    };

    try {
        const response = await fetch(`https://teaching.cmkl.ai/api/job/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.applied_for_job) {
            window.location.href = "jobs_applied.html";
        } else if (data.error && data.error.includes("user education is less than job requires")) {
            window.location.href = "jobs_applied.html";
        } else if (data.error) {
            if (msg) {
                msg.textContent = "Error: " + data.error;
                msg.className = "status-message error";
            }
            
            btn.disabled = false;
        }

    } catch (error) {
        console.error("Apply error:", error);
        if (msg) {
            msg.textContent = "Network Error. Please try again.";
            msg.className = "status-message error";
        }
        btn.disabled = false;
    }
}