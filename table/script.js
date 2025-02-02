document.addEventListener('DOMContentLoaded', function () {
    const calendar = document.getElementById('calendar');
    const commitButton = document.getElementById('commitButton');
    const resetButton = document.getElementById('resetButton');
    const datePicker = document.getElementById('datePicker');
    const monthLabels = document.getElementById('month-labels');
    const dayLabels = document.getElementById('day-labels');
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 0, 1); // Start from January 1 of the current year

    let contributions = JSON.parse(localStorage.getItem('contributions')) || {};

    function getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    function renderMonthLabels() {
        monthLabels.innerHTML = '';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const weeksInYear = 53;

        for (let col = 0; col < weeksInYear; col++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + col * 7);
            const month = currentDate.getMonth();

            // Only add a label if the month changes
            if (col === 0 || month !== new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000).getMonth()) {
                const monthLabel = document.createElement('div');
                monthLabel.classList.add('month-label');
                monthLabel.textContent = months[month];
                monthLabels.appendChild(monthLabel);
            } else {
                const emptyLabel = document.createElement('div');
                emptyLabel.classList.add('month-label');
                monthLabels.appendChild(emptyLabel);
            }
        }
    }

    function renderDayLabels() {
        dayLabels.innerHTML = '';
        const days = ['Mon', 'Wed', 'Fri']; // Only show Mon, Wed, Fri for simplicity

        days.forEach(day => {
            const dayLabel = document.createElement('div');
            dayLabel.classList.add('day-label');
            dayLabel.textContent = day;
            dayLabels.appendChild(dayLabel);
        });
    }

    function renderCalendar() {
        calendar.innerHTML = '';
        const daysOfWeek = 7; // 7 rows (days of the week)
        const weeksInYear = 53; // 53 columns to account for partial first and last weeks
    
        // Determine the day of the week for January 1st
        const startDayOfWeek = startDate.getDay();
    
        // Create a grid with 7 rows and 53 columns
        for (let row = 0; row < daysOfWeek; row++) {
            for (let col = 0; col < weeksInYear; col++) {
                const day = document.createElement('div');
                day.classList.add('day');
                calendar.appendChild(day);
            }
        }
    
        // Fill in the grid with contributions
        for (let i = 0; i < 365; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dateString = currentDate.toISOString().split('T')[0];
            const dayOfYear = getDayOfYear(currentDate); // 1 to 365
            const dayOfWeek = currentDate.getDay(); // 0 (Sunday) to 6 (Saturday)
    
            // Adjust column calculation to account for partial first week
            const col = Math.floor((dayOfYear - 1 + startDayOfWeek) / 7);
            const row = dayOfWeek;
    
            // Calculate the index in the grid
            const index = row + col * daysOfWeek;
            const dayElement = calendar.children[index];
    
            // Get the number of contributions for the current date
            const contributionCount = contributions[dateString] || 0;
    
            // Apply the appropriate class based on contribution count
            if (contributionCount >= 5) {
                dayElement.classList.add('level-5');
            } else if (contributionCount === 4) {
                dayElement.classList.add('level-4');
            } else if (contributionCount === 3) {
                dayElement.classList.add('level-3');
            } else if (contributionCount === 2) {
                dayElement.classList.add('level-2');
            } else if (contributionCount === 1) {
                dayElement.classList.add('level-1');
            }
    
            // Optional: Add a tooltip to show the contribution count
            dayElement.title = `${contributionCount} contribution${contributionCount !== 1 ? 's' : ''}`;
        }
    }

    commitButton.addEventListener('click', function () {
        const selectedDate = datePicker.value;
    
        if (!selectedDate) {
            dateString = today.toISOString().split('T')[0]; // Assign today's date
        } else {
            dateString = new Date(selectedDate).toISOString().split('T')[0]; // Assign selected date
        }
    
        contributions[dateString] = (contributions[dateString] || 0) + 1;
        localStorage.setItem('contributions', JSON.stringify(contributions));
        renderCalendar();
    });

    resetButton.addEventListener('click', function () {
        contributions = {};
        localStorage.removeItem('contributions');
        renderCalendar();
    });

    // Initialize the calendar
    renderMonthLabels();
    renderDayLabels();
    renderCalendar();
});