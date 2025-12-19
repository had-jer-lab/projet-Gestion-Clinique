function switchTab(tab) {
    const login = document.getElementById('login-form');
    const signup = document.getElementById('signup-form');
    const tabs = document.querySelectorAll('.tab');
    if (tab === 'login') {
    login.classList.add('active');
    signup.classList.remove('active');
    tabs[0].classList.add('active');
    tabs[1].classList.remove('active');
    } else {
    login.classList.remove('active');
    signup.classList.add('active');
    tabs[0].classList.remove('active');
    tabs[1].classList.add('active');
    }
    }
    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
    switchTab('login');
    });