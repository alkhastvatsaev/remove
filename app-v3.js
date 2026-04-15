document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) window.lucide.createIcons();

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const processingView = document.getElementById('processing-view');
    const resultView = document.getElementById('result-view');
    const originalImg = document.getElementById('original-img');
    const resultImg = document.getElementById('result-img');
    const progressBar = document.getElementById('progress-bar');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-btn');

    let resultBlob = null;
    let removeBackground = null;

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => e.preventDefault());
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    async function handleFile(file) {
        if (!file.type.startsWith('image/')) return;

        dropZone.classList.add('hidden');
        processingView.classList.remove('hidden');
        resultView.classList.add('hidden');
        originalImg.src = URL.createObjectURL(file);
        
        try {
            if (!removeBackground) {
                // Using jspm.dev as an alternative to esm.sh which might be more stable
                const module = await import("https://jspm.dev/@imgly/background-removal@1.4.5");
                removeBackground = module.default;
            }

            const config = {
                // Trying a slightly different URL structure that often works better
                publicPath: 'https://static.img.ly/packages/@imgly/background-removal-data/1.4.5/dist/',
                fetchArgs: {
                    mode: 'cors'
                },
                progress: (msg) => {
                    if (msg.includes('fetch')) progressBar.style.width = '20%';
                    if (msg.includes('load')) progressBar.style.width = '50%';
                    if (msg.includes('render')) progressBar.style.width = '80%';
                }
            };

            console.log("Starting removal with config:", config);
            const blob = await removeBackground(file, config);
            
            resultBlob = blob;
            resultImg.src = URL.createObjectURL(blob);
            
            progressBar.style.width = '100%';
            setTimeout(() => {
                processingView.classList.add('hidden');
                resultView.classList.remove('hidden');
                progressBar.style.width = '0%';
            }, 800);

        } catch (error) {
            console.error("Détail de l'erreur:", error);
            alert("Erreur: " + error.message + " (Consultez la console pour plus de détails)");
            reset();
        }
    }

    function reset() {
        resultBlob = null;
        dropZone.classList.remove('hidden');
        processingView.classList.add('hidden');
        resultView.classList.add('hidden');
        fileInput.value = '';
        progressBar.style.width = '0%';
    }

    resetBtn.addEventListener('click', reset);
    downloadBtn.addEventListener('click', () => {
        if (!resultBlob) return;
        const url = URL.createObjectURL(resultBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "resultat.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});
