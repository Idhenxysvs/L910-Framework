const servicesData = {
    cinema: {
        title: "Кинотеатр",
        description: "",
        port: 3001,
        url: "http://localhost:3001"
    },
    gym: {
        title: "Тренажёрный зал 'Силач'",
        description: "",
        port: 3002,
        url: "http://localhost:3002"
    },
    concerts: {
        title: "Менеджер концертов ConcertFlow",
        description: "",
        port: 3003,
        url: "http://localhost:3003"
    },
    bank: {
        title: "Банк",
        description: "",
        port: 3004,
        url: "http://localhost:3004"
    }
};

document.querySelectorAll('.service-card, .service-btn').forEach(element => {
    element.addEventListener('click', function() {
        const serviceType = this.dataset.service;
        const service = servicesData[serviceType];
        
        if (service && service.url) {
            window.open(service.url, '_blank');
        }
    });
});

document.querySelectorAll('.info-card').forEach(element => {
    element.addEventListener('click', function() {
        const services = Object.keys(servicesData);
        const randomService = services[Math.floor(Math.random() * services.length)];
        const service = servicesData[randomService];
        
        if (service && service.url) {
            window.open(service.url, '_blank');
        }
    });
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