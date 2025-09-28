const search = document.getElementById('addressBar');
const searchForm = document.getElementById('search-form');
const iframe = document.getElementById('frame');
const reloadBtn = document.getElementById('reloadBtn');

let iframeHistory = [];
let currentIndex = -1;
let navWatchdog = null;

function goThroughProxy(url) {
    if (!url.includes('.') && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://duckduckgo.com/?q=' + encodeURIComponent(url);
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    const finalUrl = url;
    function pushHistory() {
        if (iframeHistory[currentIndex] !== finalUrl) {
            iframeHistory = iframeHistory.slice(0, currentIndex + 1);
            iframeHistory.push(finalUrl);
            currentIndex++;
        }
    }

    // try using scramjet proxy; fallback to direct navigation on failure
    try {
        if (typeof scramjet !== 'undefined' && typeof scramjet.encodeUrl === 'function') {
            const encodedUrl = scramjet.encodeUrl(finalUrl);
            // set a watchdog to detect proxy/Wisp failure and fallback
            if (navWatchdog) clearTimeout(navWatchdog);
            let loaded = false;
            const onLoad = () => { loaded = true; clearTimeout(navWatchdog); try { iframe.removeEventListener('load', onLoad); iframe.removeEventListener('error', onError); } catch(e){} };
            const onError = () => { loaded = false; clearTimeout(navWatchdog); try { iframe.removeEventListener('load', onLoad); iframe.removeEventListener('error', onError); } catch(e){}; iframe.src = finalUrl; pushHistory(); };
            iframe.addEventListener('load', onLoad);
            iframe.addEventListener('error', onError);
            iframe.src = window.location.origin + encodedUrl;
            navWatchdog = setTimeout(()=>{
                if (!loaded) {
                    try { iframe.removeEventListener('load', onLoad); iframe.removeEventListener('error', onError); } catch(e){}
                    iframe.src = finalUrl;
                    pushHistory();
                }
            }, 4500);
            return;
        }
    } catch (e) {
        console.warn('Proxy encode failed, falling back to direct navigation', e);
    }

    // fallback: direct navigation to the URL
    iframe.src = finalUrl;
    pushHistory();
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
