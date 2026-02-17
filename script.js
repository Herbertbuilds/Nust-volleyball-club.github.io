/*dynamic count down*/
let _countdownTimer = null;

function _updateCountdownDisplay(targetTs) {
    const dElem = document.getElementById("days");
    const hElem = document.getElementById("hours");
    const mElem = document.getElementById("minutes");
    const sElem = document.getElementById("seconds");

    const now = Date.now();
    const distance = targetTs - now;

    if (distance <= 0) {
        if (document.querySelector('.countdown-display')) document.querySelector('.countdown-display').textContent = 'MATCH STARTED';
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
    _updateCountdownDisplay(targetDateTs); // initial match information update

    _countdownTimer = setInterval(() => {
        const stillRunning = _updateCountdownDisplay(targetDateTs);
        if (!stillRunning) {
            clearInterval(_countdownTimer);
            _countdownTimer = null;
            if (typeof onFinished === 'function') onFinished();
        }
    }, 1000);
}

function parseMatchesFromDoc(doc = document) {
    const items = Array.from(doc.querySelectorAll('.match-card'));
    const matches = items.map(card => {
        const timeElem = card.querySelector('time[datetime]');
        const dateStr = timeElem ? timeElem.getAttribute('datetime') : null;

        // time is in the first .meta-item (format like "15:00")
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

async function findNextMatch() {
    let matches = parseMatchesFromDoc(document);

    if (!matches.length) {
        try {
            const res = await fetch('schedule.html');
            if (!res.ok) throw new Error('Failed to fetch schedule');
            const text = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            matches = parseMatchesFromDoc(doc);

            try {
                const localCards = Array.from(document.querySelectorAll('.match-card'));
                if (localCards.length && matches.length) {
                    matches = matches.map(m => {
                        const found = localCards.find(card => {
                            const timeElem = card.querySelector('time[datetime]');
                            const dateStr = timeElem ? timeElem.getAttribute('datetime') : null;
                            const metaItems = Array.from(card.querySelectorAll('.meta-item'));
                            let timeText = null;
                            for (const mi of metaItems) {
                                const txt = mi.textContent.trim();
                                const tmatch = txt.match(/(\d{1,2}:\d{2})/);
                                if (tmatch) { timeText = tmatch[1]; break; }
                            }
                            if (!dateStr) return false;
                            const iso = (timeText) ? `${dateStr}T${timeText}:00` : `${dateStr}T00:00:00`;
                            const candDt = new Date(iso);
                            if (isNaN(candDt)) return false;
                            const home = card.querySelector('.team.home .team-name')?.textContent.trim() || '';
                            const away = card.querySelector('.team.away .team-name')?.textContent.trim() || '';
                            return candDt.getTime() === m.datetime.getTime() && home === m.home && away === m.away;
                        });
                        if (found) m.cardElement = found;
                        return m;
                    });
                }
            } catch (e) { }
        } catch (err) {
            console.error('Could not load schedule to determine next match:', err);
            matches = [];
        }
    }

    const now = new Date();
    const upcoming = matches.filter(m => m.datetime > now).sort((a,b) => a.datetime - b.datetime);
    return upcoming.length ? upcoming[0] : null;
}

function formatMatchLabel(match) {
    if (!match) return 'No upcoming matches';
    const teams = (match.home && match.away) ? `${match.home} vs ${match.away}` : `${match.home}${match.away}`;
    const dateStr = match.datetime.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = match.datetime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${teams} — ${dateStr}, ${timeStr}`;
}

// Find the local .match-card element that corresponds to a parsed match
function findLocalCardForMatch(match) {
    const localCards = Array.from(document.querySelectorAll('.match-card'));
    return localCards.find(card => {
        const timeElem = card.querySelector('time[datetime]');
        const dateStr = timeElem ? timeElem.getAttribute('datetime') : null;
        const metaItems = Array.from(card.querySelectorAll('.meta-item'));
        let timeText = null;
        for (const mi of metaItems) {
            const txt = mi.textContent.trim();
            const tmatch = txt.match(/(\d{1,2}:\d{2})/);
            if (tmatch) { timeText = tmatch[1]; break; }
        }
        if (!dateStr) return false;
        const iso = (timeText) ? `${dateStr}T${timeText}:00` : `${dateStr}T00:00:00`;
        const candDt = new Date(iso);
        if (isNaN(candDt)) return false;
        const home = card.querySelector('.team.home .team-name')?.textContent.trim() || '';
        const away = card.querySelector('.team.away .team-name')?.textContent.trim() || '';
        return candDt.getTime() === match.datetime.getTime() && home === match.home && away === match.away;
    });
}

async function initDynamicCountdown() {
    const next = await findNextMatch();

    const infoElem = document.getElementById('next-match-info');
    if (infoElem) infoElem.textContent = next ? `${next.datetime.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}, ${next.datetime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'No upcoming matches';

    if (!next) {
        if (document.querySelector('.countdown-display')) document.querySelector('.countdown-display').textContent = '-- : -- : -- : --';
        return;
    }

    // if schedule exists on this page, optionally highlight the next match
    try {
        document.querySelectorAll('.match-card.upcoming').forEach(el => el.classList.remove('upcoming'));
        if (next.cardElement && document.contains(next.cardElement)) next.cardElement.classList.add('upcoming');
    } catch (e) {}

    

    startCountdownTo(next.datetime.getTime(), async () => {
        // when a match finishes, remove it and move to next
        try {
            let removed = false;

            if (next.cardElement && document.contains(next.cardElement)) {
                next.cardElement.remove();
                console.log('Removed match card (direct):', next.home, 'vs', next.away);
                removed = true;
            } else {
                const local = findLocalCardForMatch(next);
                if (local) {
                    local.remove();
                    console.log('Removed match card (found):', next.home, 'vs', next.away);
                    removed = true;
                }
            }

            if (!removed) console.warn('Could not find match card to remove for', next.home, 'vs', next.away);
        } catch (e) {
            console.error('Error removing finished match card:', e);
        }

        await initDynamicCountdown();
    });
}



/*schedule page functionality*/
/*customizing switching active*/
const tabs = document.querySelectorAll('.tab');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

/*filtering for the tabs options*/
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById("days")) {
        initDynamicCountdown();
    }

    const tabs = document.querySelectorAll('.tab');
    const items = document.querySelectorAll('.filter-item');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // filtering
            const filterValue = tab.getAttribute('data-filter') || tab.textContent;
            
            items.forEach(item => {
                const category = item.getAttribute('data-category');
                //show all if filter value is "All"
                item.style.display = (filterValue === 'All' || filterValue === category) ? "" : "none";
            });
        });
    });
});


// dropdown functionality for the details button in the activities page
function toggleDropdown(button) {
    const cardWrapper = button.closest('.secondary-card-wrapper');
    const dropdown = cardWrapper.querySelector('.details-dropdown');
    
    dropdown.classList.toggle('active');
    
    button.textContent = dropdown.classList.contains('active') ? 'CLOSE' : 'DETAILS';
}

window.addEventListener('load', () => {
    const hash = window.location.hash;
    
    if (hash) {
        const targetEvent = document.querySelector(hash);
        
        if (targetEvent) {
            const detailsBtn = targetEvent.querySelector('.details-btn');
            if (detailsBtn) {
                detailsBtn.click();
            }
        }
    }
});