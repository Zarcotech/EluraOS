const search = document.getElementById('addressBar');
const searchForm = document.getElementById('search-form');
const iframe = document.getElementById('frame');
const reloadBtn = document.getElementById('reloadBtn');

let iframeHistory = [];
let currentIndex = -1;

function animateIframeOut() {
    try {
        iframe.style.transition = 'opacity 220ms ease, transform 260ms cubic-bezier(.2,.8,.2,1)';
        iframe.style.opacity = '0';
        iframe.style.transform = 'scale(0.995)';
    } catch (e) {}
}

function animateIframeIn() {
    try {
        iframe.style.transition = 'opacity 360ms cubic-bezier(.2,.8,.2,1), transform 320ms cubic-bezier(.2,.8,.2,1)';
        iframe.style.opacity = '1';
        iframe.style.transform = 'scale(1)';
    } catch (e) {}
}

function spinReload() {
    try {
        reloadBtn.animate([
            { transform: 'rotate(0deg)' },
            { transform: 'rotate(360deg)' }
        ], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
    } catch (e) {}
}

function goThroughProxy(url) {
    if (!url.includes('.') && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://duckduckgo.com/?q=' + encodeURIComponent(url);
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    // animate out, then navigate
    animateIframeOut();
    const finalUrl = url;
    setTimeout(() => {
        const encodedUrl = (typeof scramjet !== 'undefined' && typeof scramjet.encodeUrl === 'function') ? scramjet.encodeUrl(finalUrl) : finalUrl;
        iframe.src = (encodedUrl.startsWith('http') ? encodedUrl : window.location.origin + encodedUrl);
        if (iframeHistory[currentIndex] !== finalUrl) {
            iframeHistory = iframeHistory.slice(0, currentIndex + 1);
            iframeHistory.push(finalUrl);
            currentIndex++;
        }
    }, 80);
}

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    goThroughProxy(search.value);
});

reloadBtn.addEventListener('click', () => {
    spinReload();
    // a tiny delay to let the spin start
    setTimeout(()=>{ iframe.src = iframe.src; }, 50);
});

iframe.addEventListener('load', () => {
    animateIframeIn();
    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const links = iframeDoc.querySelectorAll('a');
        links.forEach(link => link.setAttribute('target', '_self'));
        iframeDoc.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            e.preventDefault();
            goThroughProxy(link.href);
        });
    } catch {
        console.warn('cross-origin, cannot modify links inside iframe');
    }
});