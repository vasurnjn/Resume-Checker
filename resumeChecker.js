document.getElementById("resumeFile").addEventListener("change", handleFile);

async function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById("loader").style.display = "block";

    const extractedText = await extractTextFromFile(file);
    if (!extractedText) {
        alert("Failed to read the resume!");
        return;
    }

    analyzeResume(extractedText);
}

async function extractTextFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async function (event) {
            const text = event.target.result;
            resolve(text);
        };

        reader.onerror = function () {
            reject("Error reading file");
        };

        if (file.type === "application/pdf") {
            const pdfjsLib = window["pdfjs-dist/build/pdf"];
            pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onload = async function () {
                const pdf = await pdfjsLib.getDocument({ data: reader.result }).promise;
                let text = "";
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map((item) => item.str).join(" ") + " ";
                }
                resolve(text);
            };
        } else {
            reader.readAsText(file);
        }
    });
}

async function analyzeResume(resumeText) {
    const apiKey = ""; 
    const endpoint = "https://api.cohere.com/v1/generate";

    const requestData = {
        model: "command", 
        prompt: `Evaluate this resume based on formatting, skills, and experience. Give a score (0-100) and a short feedback:\n${resumeText}\nScore:`,
        max_tokens: 50,
        temperature: 0.7
    };

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();
        if (data.generations && data.generations[0]) {
            const output = data.generations[0].text.trim();
            const [score, feedback] = output.split("\n", 2);
            displayResult(parseInt(score) || 50, feedback || "Feedback not available.");
        } else {
            displayResult(50, "Could not analyze the resume properly.");
        }
    } catch (error) {
        console.error("Error:", error);
        displayResult(50, "Error connecting to AI.");
    }
}

function displayResult(score, feedback) {
    document.getElementById("loader").style.display = "none";
    document.getElementById("score").innerText = score;
    document.getElementById("progressBar").value = score;
    document.getElementById("feedback").innerText = feedback;
}

