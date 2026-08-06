        let currentResults = null;

        // Auto-show WhatsApp popup after 800ms
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                document.getElementById('waModal').classList.add('active');
            }, 800);
        });

        function closeWaModal() {
            document.getElementById('waModal').classList.remove('active');
        }

        document.getElementById('numInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') fetchData();
        });

        function getOperator(num) {
            if (!num) return 'Unknown';
            let clean = num.toString().replace(/\D/g, '');
            if (clean.startsWith('92')) {
                clean = '0' + clean.slice(2);
            }
            if (clean.length < 4) return 'Unknown';
            const prefix = clean.substring(0, 4);
            if (/^030[0-9]|^032[0-9]/.test(prefix)) return 'Jazz / Warid';
            if (/^034[0-9]/.test(prefix)) return 'Telenor';
            if (/^033[0-9]|^037[0-9]/.test(prefix)) return 'Ufone / Onic';
            if (/^031[0-9]/.test(prefix)) return 'Zong';
            if (/^0355/.test(prefix)) return 'Scom';
            return 'Unknown';
        }

        async function fetchData(overrideNumber = null) {
            const inputEl = document.getElementById('numInput');
            const searchVal = overrideNumber || inputEl.value.trim();
            
            if (!searchVal) {
                alert("Please enter a phone number or CNIC!");
                return;
            }

            inputEl.value = searchVal;
            const loader = document.getElementById('loader');
            const resultsDiv = document.getElementById('results');
            const errorDiv = document.getElementById('errorOutput');
            const searchBtn = document.getElementById('searchBtn');
            const btnIcon = document.getElementById('btnIcon');
            const btnText = document.getElementById('btnText');
            const actionsBar = document.getElementById('actionsBar');

            resultsDiv.innerHTML = "";
            errorDiv.style.display = 'none';
            actionsBar.style.display = 'none';
            
            loader.style.display = 'block';
            searchBtn.disabled = true;
            btnIcon.className = "fa-solid fa-circle-notch fa-spin";
            btnText.innerText = "Searching...";

            try {
                const response = await fetch('https://famofc.site/api/database.php?number=');
                
                if (!response.ok) throw new Error("Server Error");
                const data = await response.json();

                loader.style.display = 'none';

                if (data && data.status === "Success" && Array.isArray(data.records) && data.records.length > 0) {
                    const normalizedRecords = data.records.map(r => ({
                        name: r.Name || 'N/A',
                        mobile: r.Mobile || 'N/A',
                        cnic: r.CNIC || 'N/A',
                        address: r.ADDRESS || 'Not Available',
                        operator: getOperator(r.Mobile)
                    }));
                    currentResults = normalizedRecords;
                    renderSuccess(normalizedRecords);
                    actionsBar.style.display = 'flex';
                } else {
                    showError("No database records found for this entry.");
                }
            } catch (error) {
                loader.style.display = 'none';
                showError("Api Request Is Down Try Again!");
            } finally {
                searchBtn.disabled = false;
                btnIcon.className = "fa-solid fa-search";
                btnText.innerText = "Search Database";
            }
        }

        function renderSuccess(records) {
            const resultsDiv = document.getElementById('results');
            let html = '';

            records.forEach((record, index) => {
                // Staggered delay for each card animation
                const delay = (index * 0.1).toFixed(1);
                html += `
                <div class="record-card" style="animation-delay: ${delay}s;">
                    <div class="record-header">
                        <div class="record-title">Record #${index + 1}</div>
                    </div>
                    <div class="record-grid">
                        <div class="info-item grid-full-width">
                            <span class="info-label">Name</span>
                            <span class="info-value">${record.name}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Mobile</span>
                            <span class="info-value">${record.mobile}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">CNIC</span>
                            <span class="info-value">${record.cnic}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Operator</span>
                            <span class="info-value">${record.operator}</span>
                        </div>
                        <div class="info-item grid-full-width">
                            <span class="info-label">Address</span>
                            <span class="info-value">${record.address}</span>
                        </div>
                    </div>
                </div>`;
            });

            resultsDiv.innerHTML = html;
        }

        function showError(msg) {
            const errorDiv = document.getElementById('errorOutput');
            const errorMsg = document.getElementById('errorMsg');
            errorMsg.innerText = msg;
            errorDiv.style.display = 'flex';
        }

        function handleGetOtherNumbers() {
            if (currentResults && currentResults.length > 0 && currentResults[0].cnic) {
                const cnic = currentResults[0].cnic;
                fetchData(cnic); 
            } else {
                alert("No CNIC available to search for other numbers.");
            }
        }

        async function handleCopy() {
            if (!currentResults) return;
            let textToCopy = currentResults.map((r, i) => 
                `--- Record ${i+1} ---\nName: ${r.name}\nMobile: ${r.mobile}\nCNIC: ${r.cnic}\nAddress: ${r.address}\nOperator: ${r.operator}`
            ).join('\n\n');

            try {
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(textToCopy);
                } else {
                    const textArea = document.createElement("textarea");
                    textArea.value = textToCopy;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                }
                const btnText = document.getElementById('copyBtnText');
                btnText.innerText = "Copied!";
                setTimeout(() => {
                    btnText.innerText = "Copy All Data";
                }, 2000);
            } catch (err) {
                alert("Failed to copy data.");
            }
        }
