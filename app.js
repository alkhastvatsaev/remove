document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) {
        window.lucide.createIcons();
    }

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

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.border = "1px solid #000"; });
    dropZone.addEventListener('dragleave', () => { dropZone.style.border = ""; });
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
            // Load library with bundling to avoid cross-domain dependency issues
            if (!removeBackground) {
                const module = await import("https://esm.sh/@imgly/background-removal@1.4.5?bundle");
                removeBackground = module.default;
            }

            const config = {
                // Pointing to unpkg which is often more reliable for static data files
                publicPath: 'https://unpkg.com/@imgly/background-removal-data@1.4.5/dist/',
                progress: (msg) => {
                    if (msg.includes('fetch')) progressBar.style.width = '20%';
                    if (msg.includes('load')) progressBar.style.width = '50%';
                    if (msg.includes('render')) progressBar.style.width = '80%';
                }
            };

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
            console.error(error);
            alert("Erreur: " + error.message);
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
        const img = new Image();
        img.src = URL.createObjectURL(resultBlob);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `product.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                URL.revokeObjectURL(img.src);
            }, 'image/png');
        };
    });
});
