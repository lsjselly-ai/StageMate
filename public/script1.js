window.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('posterTrack');
    const prevBtn = document.getElementById('prevPostBtn');
    const nextBtn = document.getElementById('nextPostBtn');

    if (track && track.children.length > 0) {
        const cards = Array.from(track.children);

        cards.forEach(card => {
            const clone = card.cloneNode(true);
            track.appendChild(clone);
        });

        let currentIndex = 0;
        const cardWidth = 280 + 15;
        const originalLength = cards.length;

        function moveSlider() {
            track.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
            track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
        }

        function nextSlide() {
            currentIndex++;
            moveSlider();

            if (currentIndex === originalLength) {
                setTimeout(() => {
                    track.style.transition = 'none';
                    currentIndex = 0;
                    track.style.transform = `translateX(0)`;
                }, 500);
            }
        }

        function prevSlide() {
            if (currentIndex === 0) {
                track.style.transition = 'none';
                currentIndex = originalLength;
                track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
                setTimeout(() => {
                    currentIndex--;
                    moveSlider();
                }, 20);
            } else {
                currentIndex--;
                moveSlider();
            }
        }

        if (nextBtn) nextBtn.addEventListener('click', nextSlide);
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);

        let autoTimer = setInterval(nextSlide, 3000);

        const windowWrapper = document.querySelector('.poster-slider-window');
        if (windowWrapper) {
            windowWrapper.addEventListener('mouseenter', () => clearInterval(autoTimer));
            windowWrapper.addEventListener('mouseleave', () => autoTimer = setInterval(nextSlide, 3000));
        }
    }

    let currentDate = new Date();

    const concertSchedules = [
        { title: "🎤 데이식스 콘서트", time: "KSPO DOME", start: "2026-07-03", end: "2026-07-05", concertId: 4 },
        { title: "🎤 트와이스 콘서트", time: "KSPO DOME", start: "2026-07-10", end: "2026-07-12", concertId: 2 },
        { title: "⚡ 르세라핌 콘서트", time: "인스파이어 아레나", start: "2026-07-11", end: "2026-07-12", concertId: 6 },
        { title: "🎸 코르티스 콘서트", time: "인스파이어 아레나", start: "2026-07-18", end: "2026-07-19", concertId: 3 },
        { title: "💦 2026 워터밤", time: "고양 킨텍스 제2전시장", start: "2026-07-24", end: "2026-07-26", concertId: 5 },
        { title: "🎸 2026 부산 록 페스티벌", time: "삼락생태공원", start: "2026-10-02", end: "2026-10-04", concertId: 1 },
    ];

    function getEventsForDate(dateStr) {
        const targetTime = new Date(dateStr).getTime();

        return concertSchedules.filter(concert => {
            const startTime = new Date(concert.start).getTime();
            const endTime = new Date(concert.end).getTime();
            return targetTime >= startTime && targetTime <= endTime;
        });
    }

    function renderDemoCalendar() {
        const daysContainer = document.getElementById('calendarDays');
        if (!daysContainer) return;

        daysContainer.innerHTML = '';

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const titleTarget = document.getElementById('calendarMonthTitle');
        if (titleTarget) {
            titleTarget.innerText = `${year}년 ${(month + 1).toString().padStart(2, '0')}월`;
        }

        const firstDayIndex = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.classList.add('day-cell', 'empty');
            daysContainer.appendChild(emptyCell);
        }

        for (let day = 1; day <= lastDay; day++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day-cell');
            dayCell.innerText = day;

            const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

            const dayEvents = getEventsForDate(dateString);
            if (dayEvents.length > 0) {
                dayCell.classList.add('has-event');
            }

            const today = new Date();
            if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
                dayCell.classList.add('active-day');
                showSchedule(dateString, day, year, month + 1);
            }

            dayCell.addEventListener('click', () => {
                document.querySelectorAll('.day-cell').forEach(c => c.classList.remove('active-day'));
                dayCell.classList.add('active-day');
                showSchedule(dateString, day, year, month + 1);
            });

            daysContainer.appendChild(dayCell);
        }
    }

    function showSchedule(dateString, day, year, month) {
        const textTarget = document.getElementById('selectedDateText');
        const listTarget = document.getElementById('scheduleList');

        if (textTarget) {
            textTarget.innerText = `${year}년 ${month.toString().padStart(2, '0')}월 ${day.toString().padStart(2, '0')}일`;
        }
        if (!listTarget) return;

        listTarget.innerHTML = '';

        const dayEvents = getEventsForDate(dateString);

        if (dayEvents.length > 0) {
            dayEvents.forEach(event => {
                const item = document.createElement('div');
                item.classList.add('event-item');
                item.onclick = () => location.href = `/posts?concertId=${event.concertId}`;

                item.innerHTML = `
                    <div class="event-title">${event.title}</div>
                    <div class="event-time">🎫 ${event.time}</div>
                `;
                listTarget.appendChild(item);
            });
        } else {
            listTarget.innerHTML = `<p class="no-schedule">등록된 공연 일정이 없는 날짜입니다.</p>`;
        }
    }
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderDemoCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderDemoCalendar();
        });
    }

    renderDemoCalendar();
});
const sidebarMenu = document.getElementById('sidebarMenu');
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('closeBtn');

menuBtn.addEventListener('click', () => {
    sidebarMenu.classList.add('active');
});

closeBtn.addEventListener('click', () => {
    sidebarMenu.classList.remove('active');
});

document.addEventListener('click', (e) => {
    if (!sidebarMenu.contains(e.target) && e.target !== menuBtn) {
        sidebarMenu.classList.remove('active');
    }
});
