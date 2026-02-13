/*home page functionality*/
function startCountdown() {
    const targetDate = new Date("February 28, 2026 10:00:00").getTime();

    const dElem = document.getElementById("days");
    const hElem = document.getElementById("hours");
    const mElem = document.getElementById("minutes");
    const sElem = document.getElementById("seconds");

    const timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            clearInterval(timer);
            document.querySelector(".countdown-display").innerHTML = "MATCH STARTED";
            return;
        }

        //calculate the time
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
        if(dElem) dElem.innerText = days.toString().padStart(2, '0');
        if(hElem) hElem.innerText = hours.toString().padStart(2, '0');
        if(mElem) mElem.innerText = minutes.toString().padStart(2, '0');
        if(sElem) sElem.innerText = seconds.toString().padStart(2, '0');
        
    }, 1000);
}
startCountdown();


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
        startCountdown();
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