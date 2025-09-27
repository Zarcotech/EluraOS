const search = document.getElementById('addressBar');
const searchForm = document.getElementById('search-form');
const iframe = document.getElementById('frame');
const reloadBtn = document.getElementById('reloadBtn');

let iframeHistory = [];
let currentIndex = -1;

function goThroughProxy(url) {
    if (!url.includes('.') && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://duckduckgo.com/?q=' + encodeURIComponent(url);
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    const encodedUrl = scramjet.encodeUrl(url);
    iframe.src = window.location.origin + encodedUrl;
    if (iframeHistory[currentIndex] !== url) {
        iframeHistory = iframeHistory.slice(0, currentIndex + 1);
        iframeHistory.push(url);
        currentIndex++;
    }
}

searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    goThroughProxy(search.value);
});

reloadBtn.addEventListener('click', () => {
    iframe.src = iframe.src;
});

iframe.addEventListener('load', () => {
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
