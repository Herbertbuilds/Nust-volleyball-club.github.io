// ============= FIXED DYNAMIC COUNTDOWN FUNCTIONS =============

let _countdownTimer = null;

function _updateCountdownDisplay(targetTs) {
    const dElem = document.getElementById("days");
    const hElem = document.getElementById("hours");
    const mElem = document.getElementById("minutes");
    const sElem = document.getElementById("seconds");

    const now = Date.now();
    const distance = targetTs - now;

    if (distance <= 0) {
        if (document.querySelector('.countdown-display')) {
            document.querySelector('.countdown-display').textContent = 'MATCH STARTED';
        }
        return false;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (dElem) dElem.innerText = String(days).padStart(2, '0');
    if (hElem) hElem.innerText = String(hours).padStart(2, '0');
    if (mElem) mElem.innerText = String(minutes).padStart(2, '0');
    if (sElem) sElem.innerText = String(seconds).padStart(2, '0');

    return true;
}

function startCountdownTo(targetDateTs, onFinished) {
    if (_countdownTimer) clearInterval(_countdownTimer);
    _updateCountdownDisplay(targetDateTs);

    _countdownTimer = setInterval(() => {
        const stillRunning = _updateCountdownDisplay(targetDateTs);
        if (!stillRunning) {
            clearInterval(_countdownTimer);
            _countdownTimer = null;
            if (typeof onFinished === 'function') onFinished();
        }
    }, 1000);
}

//Get matches directly from scheduleData
function getMatchesFromData() {
    if (typeof scheduleData === 'undefined' || !scheduleData.length) {
        console.log('No schedule data available');
        return [];
    }
    
    return scheduleData.map(match => {
        // Create date object from match date and time
        const dateTimeStr = `${match.date}T${match.time}:00`;
        const dt = new Date(dateTimeStr);
        
        return {
            datetime: dt,
            home: match.homeTeam,
            away: match.awayTeam,
            location: match.location,
            category: match.category,
            id: match.id
        };
    });
}

//Find the next match using scheduleData
async function findNextMatch() {
    console.log('Finding next match from schedule data...');
    
    //Get matches from scheduleData array
    let matches = getMatchesFromData();
    
    // If no matches in data, try the old method as fallback
    if (!matches.length) {
        console.log('No matches from data, trying DOM parsing');
        matches = parseMatchesFromDoc(document);
    }

    const now = new Date();
    console.log('Current time:', now.toString());
    
    //filter for upcoming matches and sort
    const upcoming = matches
        .filter(m => {
            const isValid = m.datetime && !isNaN(m.datetime.getTime());
            if (!isValid) return false;
            return m.datetime > now;
        })
        .sort((a, b) => a.datetime - b.datetime);
    
    console.log('Upcoming matches found:', upcoming.length);
    if (upcoming.length > 0) {
        console.log('Next match:', upcoming[0].home, 'vs', upcoming[0].away, 'at', upcoming[0].datetime.toString());
    }
    
    return upcoming.length ? upcoming[0] : null;
}

//Keep parseMatchesFromDoc as fallback (unchanged)
function parseMatchesFromDoc(doc = document) {
    const items = Array.from(doc.querySelectorAll('.match-card'));
    const matches = items.map(card => {
        const timeElem = card.querySelector('time[datetime]');
        const dateStr = timeElem ? timeElem.getAttribute('datetime') : null;

        const metaItems = Array.from(card.querySelectorAll('.meta-item'));
        let timeText = null;
        for (const m of metaItems) {
            const txt = m.textContent.trim();
            const tmatch = txt.match(/(\d{1,2}:\d{2})/);
            if (tmatch) { timeText = tmatch[1]; break; }
        }

        if (!dateStr) return null;
        const iso = (timeText) ? `${dateStr}T${timeText}:00` : `${dateStr}T00:00:00`;
        const dt = new Date(iso);
        if (isNaN(dt)) return null;

        const home = card.querySelector('.team.home .team-name')?.textContent.trim() || '';
        const away = card.querySelector('.team.away .team-name')?.textContent.trim() || '';
        const location = (metaItems[1] || metaItems.find(mi => /map/i.test(mi.textContent)))?.textContent.replace(/\s+/g, ' ').trim() || '';
        const category = card.getAttribute('data-category') || '';
        return { datetime: dt, home, away, location, category, cardElement: card };
    }).filter(Boolean);

    return matches;
}

//Initialize countdown with better error handling
async function initDynamicCountdown() {
    console.log('Initializing countdown...');
    
    try {
        const next = await findNextMatch();

        const infoElem = document.getElementById('next-match-info');
        if (infoElem) {
            if (next) {
                const dateStr = next.datetime.toLocaleDateString(undefined, { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                });
                const timeStr = next.datetime.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                infoElem.textContent = `${dateStr}, ${timeStr}`;
                console.log('Updated next match info:', infoElem.textContent);
            } else {
                infoElem.textContent = 'No upcoming matches';
                console.log('No upcoming matches found');
            }
        }

        if (!next) {
            const countdownDisplay = document.querySelector('.countdown-display');
            if (countdownDisplay) {
                countdownDisplay.textContent = '-- : -- : -- : --';
            }
            return;
        }

        //start the countdown
        console.log('Starting countdown to:', next.datetime.toString());
        startCountdownTo(next.datetime.getTime(), async () => {
            console.log('Match finished, finding next match...');
            await initDynamicCountdown();
        });
        
    } catch (e) {
        console.error('Error in countdown initialization:', e);
        const countdownDisplay = document.querySelector('.countdown-display');
        if (countdownDisplay) {
            countdownDisplay.textContent = '-- : -- : -- : --';
        }
    }
}

// ============= RENDERING FUNCTIONS =============

// Render Roster with Lazy Loading
function renderRoster() {
    const playerGrid = document.getElementById('player-grid');
    if (!playerGrid || typeof playersData === 'undefined') return;

    let html = '';
    
    for (const [category, players] of Object.entries(playersData)) {
        players.forEach(player => {
            html += `
                <div class="player-card filter-item" data-category="${player.category}">
                    <figure class="player-image">
                        <img src="${player.image}" 
                             loading="lazy" 
                             alt="${player.name}" 
                             onerror="this.src='assets/players/placeholder.jpg'">
                        <figcaption class="player-overlay">
                            <span class="position-label">Position</span>
                            <p class="position-name">${player.position}</p>
                        </figcaption>
                    </figure>
                    <div class="player-info">
                        <div class="name-row">
                            <h3>${player.name}</h3>
                            <span class="player-number">${player.number}</span>
                        </div>
                        ${player.status ? `<p class="player-status">${player.status}</p>` : ''}
                    </div>
                </div>
            `;
        });
    }
    
    playerGrid.innerHTML = html;
}

// Render Activities
function renderActivities() {
    const primarySection = document.getElementById('primary-event-section');
    const secondarySection = document.getElementById('secondary-events');
    
    if (primarySection && typeof activitiesData !== 'undefined' && activitiesData.primary) {
        primarySection.innerHTML = `
            <div id="main-event" class="primary-card">
                <div class="event-details">
                    <span class="badge-primary">${activitiesData.primary.badge}</span>
                    <h2 class="event-title">${activitiesData.primary.title}</h2>
                    <p class="event-desc">${activitiesData.primary.description}</p>
                    <div class="event-meta">
                        <span><i class="fa-regular fa-calendar"></i> ${activitiesData.primary.date}</span>
                        <span><i class="fa-solid fa-map-pin"></i> ${activitiesData.primary.location}</span>
                    </div>
                </div>
                <div class="event-visual-box">
                    <i class="${activitiesData.primary.icon}"></i>
                </div>
            </div>
        `;
    }
    
    if (secondarySection && typeof activitiesData !== 'undefined' && activitiesData.secondary) {
        let html = '';
        activitiesData.secondary.forEach(event => {
            html += `
                <div id="${event.id}" class="secondary-card-wrapper">
                    <div class="secondary-card">
                        <div class="date-box">
                            <span class="month">${event.month}</span>
                            <span class="day">${event.days}</span>
                        </div>
                        <div class="event-info">
                            <h3>${event.title}</h3>
                            <p>${event.description}</p>
                        </div>
                        <div class="event-action">
                            <div class="time-data">
                                <span class="label">TIME</span>
                                <span class="value">${event.time}</span>
                            </div>
                            <button class="details-btn" onclick="toggleDropdown(this)">DETAILS</button>
                        </div>
                    </div>
                    <div class="details-dropdown">
                        <div class="dropdown-inner">
                            <p><strong>Requirements:</strong> ${event.requirements}</p>
                            <p><strong>Location:</strong> ${event.location}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        secondarySection.innerHTML = html;
    }
}

// Render Schedule
function renderSchedule() {
    const scheduleList = document.querySelector('.schedule-list');
    if (!scheduleList || typeof scheduleData === 'undefined') return;

    let html = '';
    scheduleData.forEach(match => {
        const date = new Date(match.date);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
        const year = date.getFullYear();
        
        html += `
            <div class="match-card filter-item" data-category="${match.category}">
                <time datetime="${match.date}" class="match-date">
                    ${day} <br> 
                    <span class="match-month">${month} ${year}</span>
                </time>

                <div class="match-teams">
                    <div class="team home">
                        <span class="team-name">${match.homeTeam}</span>
                    </div>
                    
                    <div class="vs-badge">VS</div>
                    
                    <div class="team away">
                        <span class="team-name">${match.awayTeam}</span>
                    </div>
                </div>

                <div class="match-meta">
                    <div class="meta-item">
                        <i class="fas fa-clock"></i> ${match.time}
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-map-marker-alt"></i> ${match.location}
                    </div>
                </div>
            </div>
        `;
    });
    
    scheduleList.innerHTML = html;
}

// Render Executive Committee with Lazy Loading
function renderExecutives() {
    const execGrid = document.querySelector('.exec-grid');
    if (!execGrid || typeof execData === 'undefined') return;

    let html = '';
    execData.forEach(exec => {
        html += `
            <div class="exec-card">
                <div class="exec-img-container">
                    <img src="${exec.image}" 
                         loading="lazy" 
                         alt="${exec.name}" 
                         onerror="this.src='assets/players/placeholder.jpg'">
                </div>
                <p class="exec-role">${exec.role}</p>
                <h4 class="exec-name">${exec.name}</h4>
            </div>
        `;
    });
    
    execGrid.innerHTML = html;
}

// Render Technical Staff with Lazy Loading
function renderTechStaff() {
    const techGrid = document.querySelector('.tech-grid');
    if (!techGrid || typeof techStaffData === 'undefined') return;

    let html = '';
    techStaffData.forEach(staff => {
        html += `
            <div class="tech-card">
                <div class="role-ribbon">${staff.role}</div>
                <div class="tech-img-wrapper">
                    <img src="${staff.image}" 
                         loading="lazy" 
                         alt="${staff.name}" 
                         onerror="this.src='assets/players/placeholder.jpg'">
                </div>
                <h3 class="tech-name">${staff.name}</h3>
            </div>
        `;
    });
    
    techGrid.innerHTML = html;
}

// Render Leadership
function renderLeadership() {
    const teamsFlex = document.querySelector('.teams-flex');
    if (!teamsFlex || typeof leadershipData === 'undefined') return;

    let html = '';
    for (const [team, leaders] of Object.entries(leadershipData)) {
        html += `
            <div class="team-column">
                <h3 class="team-name-club">${team}</h3>
                <div class="leader-row">
                    <span class="p-role">Captain</span><span class="p-name">${leaders.captain}</span>
                </div>
                <div class="leader-row">
                    <span class="p-role">Vice Captain</span><span class="p-name">${leaders.viceCaptain}</span>
                </div>
            </div>
        `;
    }
    
    teamsFlex.innerHTML = html;
}

// Render Timeline
function renderTimeline() {
    const timelineContainer = document.querySelector('.timeline-container');
    if (!timelineContainer || typeof timelineData === 'undefined') return;

    let html = '';
    timelineData.forEach(item => {
        html += `
            <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div class="timeline-header">
                    <span class="timeline-year">${item.year}</span>
                    <h4 class="timeline-status">${item.title}</h4>
                </div>
                <div class="timeline-content-box">
                    <p>${item.description}</p>
                    ${item.achievements && item.achievements.length > 0 ? `
                        <ul class="achievement-list">
                            ${item.achievements.map(ach => `
                                <li><span class="medal-icon">${ach.medal}</span> <strong>${ach.team}:</strong> ${ach.place}</li>
                            `).join('')}
                        </ul>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    timelineContainer.innerHTML = html;
}

// Render Upcoming Events for Sidebar
function renderUpcomingEvents() {
    const eventsSidebar = document.querySelector('.events-sidebar');
    if (!eventsSidebar || typeof scheduleData === 'undefined') return;

    const now = new Date();
    const upcoming = scheduleData
        .map(match => ({
            ...match,
            datetime: new Date(`${match.date}T${match.time}`)
        }))
        .filter(match => match.datetime > now)
        .sort((a, b) => a.datetime - b.datetime)
        .slice(0, 3);

    let html = '<h2>UPCOMING EVENTS</h2>';
    
    if (upcoming.length === 0) {
        html += '<p class="no-events">No upcoming events</p>';
    } else {
        upcoming.forEach(match => {
            const date = new Date(match.date);
            const formattedDate = date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
            
            html += `
                <div class="event-card">
                    <div class="event-icon-box"><i class="fas fa-trophy"></i></div>
                    <div class="event-info">
                        <span class="event-date">${formattedDate}</span>
                        <h4>${match.homeTeam} vs ${match.awayTeam}</h4>
                        <p>${match.location}</p>
                    </div>
                </div>
            `;
        });
    }
    
    html += `<a href="schedule.html" class="view-schedule-btn">VIEW FULL SCHEDULE</a>`;
    
    // Add connect section
    html += `
        <div class="connect-section">
            <p>CONNECT WITH US</p>
            <div class="social-icons-row">
                <a href="https://vm.tiktok.com/ZS9JxEdTcb669-N5Blg/" target="_blank" class="social-link">
                    <i class="fa-brands fa-tiktok"></i>
                </a>
                <a href="https://www.instagram.com/nust_volleyballclub" target="_blank" class="social-link">
                    <i class="fa-brands fa-instagram"></i>
                </a>
            </div>
        </div>
    `;
    
    eventsSidebar.innerHTML = html;
}

// ============= UTILITY FUNCTIONS =============

// Dropdown functionality for activities page
function toggleDropdown(button) {
    const cardWrapper = button.closest('.secondary-card-wrapper');
    const dropdown = cardWrapper.querySelector('.details-dropdown');
    
    dropdown.classList.toggle('active');
    button.textContent = dropdown.classList.contains('active') ? 'CLOSE' : 'DETAILS';
}

// Initialize filter tabs
function initFilters() {
    const tabs = document.querySelectorAll('.tab');
    const items = document.querySelectorAll('.filter-item');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const filterValue = tab.getAttribute('data-filter') || tab.textContent;
            
            items.forEach(item => {
                const category = item.getAttribute('data-category');
                item.style.display = (filterValue === 'All' || filterValue === category) ? "" : "none";
            });
        });
    });
}

// ============= JOIN FORM FUNCTIONS =============

// Handle join form submission
function handleJoinSubmit(event) {
    if (event) event.preventDefault();
    
    const form = document.getElementById('joinForm');
    if (!form) return;
    
    // Hide form, show success message
    form.style.display = 'none';
    const successMsg = document.getElementById('successMessage');
    if (successMsg) {
        successMsg.style.display = 'block';
    }
    
    // Scroll to top of form section smoothly
    const formSection = document.querySelector('.join-form-section');
    if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Collect form data for console (optional)
    console.log('Join form submitted:', {
        name: document.getElementById('fullName')?.value,
        studentNumber: document.getElementById('studentNumber')?.value || 'Not provided',
        experience: document.getElementById('experience')?.value,
        position: document.getElementById('position')?.value,
        phone: document.getElementById('phone')?.value,
        email: document.getElementById('email')?.value
    });
    
    return false;
}

// Reset join form
function resetJoinForm() {
    const form = document.getElementById('joinForm');
    const successMsg = document.getElementById('successMessage');
    
    if (form) {
        form.reset();
        form.style.display = 'block';
    }
    
    if (successMsg) {
        successMsg.style.display = 'none';
    }
}

// Initialize join form event listener
function initJoinForm() {
    const form = document.getElementById('joinForm');
    if (form) {
        form.addEventListener('submit', handleJoinSubmit);
    }
}

// ============= EVENT LISTENERS =============

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    console.log('scheduleData available:', typeof scheduleData !== 'undefined');
    
    // Roster page
    if (document.getElementById('player-grid')) {
        renderRoster();
    }
    
    // Activities page
    if (document.getElementById('primary-event-section')) {
        renderActivities();
    }
    
    // Schedule page
    if (document.querySelector('.schedule-list')) {
        renderSchedule();
    }
    
    // Club Info page - Executive committee
    if (document.querySelector('.exec-grid')) {
        renderExecutives();
    }
    
    // Club Info page - Technical staff
    if (document.querySelector('.tech-grid')) {
        renderTechStaff();
    }
    
    // Club Info page - Leadership section
    if (document.querySelector('.teams-flex')) {
        renderLeadership();
    }
    
    // History page
    if (document.querySelector('.timeline-container')) {
        renderTimeline();
    }
    
    // Homepage - Upcoming events sidebar
    if (document.querySelector('.events-sidebar')) {
        renderUpcomingEvents();
    }
    
    // Initialize countdown if on homepage
    if (document.getElementById("days")) {
        console.log('Countdown elements found, waiting for data...');
        // Small delay to ensure scheduleData is fully loaded
        setTimeout(() => {
            initDynamicCountdown();
        }, 500);
    }

    // Initialize filter tabs
    initFilters();
    
    // Initialize join form
    initJoinForm();
});