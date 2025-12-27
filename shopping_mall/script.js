const servicesData = {
    cinema: {
        title: "Кинотеатр ''",
        description: "",
        port: 3001
    },
    gym: {
        title: "Тренажёрный зал 'Силач'",
        description: "",
        port: 3002
    },
    concerts: {
        title: "Менеджер концертов 'ConcertFlow'",
        description: "",
        port: 3003
    },
    bank: {
        title: "Банк ''",
        description: "",
        port: 3004
    }
};

document.querySelectorAll('.service-card, .service-btn').forEach(element => {
    element.addEventListener('click', function() {
        const serviceType = this.dataset.service;
        openServiceModal(serviceType);
    });
});

function openServiceModal(serviceType) {
    const service = servicesData[serviceType];
    const modal = document.getElementById('serviceModal');
    
    document.getElementById('modalTitle').textContent = service.title;
    document.getElementById('modalDescription').textContent = service.description;
    document.getElementById('modalPort').textContent = service.port;
    
    modal.style.display = 'flex';
}

document.querySelector('.close-modal').addEventListener('click', function() {
    document.getElementById('serviceModal').style.display = 'none';
});

window.addEventListener('click', function(event) {
    const modal = document.getElementById('serviceModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

document.getElementById('testRedirect').addEventListener('click', function() {
    const port = document.getElementById('modalPort').textContent;
    // ДАЛЕЕ ДЛЯ ИПОЛЬЗОВАНИЯ => window.location.href = `http://localhost:${port}`;
});

document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: 'smooth'
        });
    });
});

document.querySelector('.btn-hero').addEventListener('click', function(e) {
    e.preventDefault();
    
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    
    window.scrollTo({
        top: targetElement.offsetTop - 80,
        behavior: 'smooth'
    });
});