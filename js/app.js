// At the top of the file, make globalState a window property
window.globalState = {
    billText: null,
    billAnalysis: null,
    selectedPersona: null,
    isSimplifiedView: false
};

// Add this function at the top level
function toggleLoading(show) {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (show) {
        loadingOverlay.classList.remove('hidden');
        document.body.classList.add('loading');
    } else {
        loadingOverlay.classList.add('hidden');
        document.body.classList.remove('loading');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    let selectedPersona = null;
    const personaCards = document.querySelectorAll('.persona-card');
    const uploadSection = document.querySelector('.upload-section');
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.querySelector('.upload-btn');
    const progressBar = document.querySelector('.progress');
    const progressText = document.querySelector('.progress-text');
    const uploadProgress = document.querySelector('.upload-progress');

    // Persona selection
    personaCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove active class from all cards
            personaCards.forEach(c => {
                c.classList.remove('active');
                c.style.transform = 'none';
            });
            
            // Add active class to selected card
            card.classList.add('active');
            
            // Store selected persona
            selectedPersona = card.dataset.persona;
            window.globalState.selectedPersona = card.dataset.persona;
            
            // Show upload section with smooth scroll
            uploadSection.classList.remove('hidden');
            uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Add visual feedback
            card.style.transform = 'translateY(-5px)';
        });
    });

    // File upload functionality
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop functionality
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    // Update the handleFiles function
    async function handleFiles(files) {
        const file = files[0];
        
        if (!file || file.type !== 'application/pdf') {
            alert('Please upload a PDF file');
            return;
        }

        try {
            // Show loading overlay
            toggleLoading(true);
            
            // Show progress
            uploadProgress.classList.remove('hidden');
            progressText.textContent = 'Reading PDF...';
            progressBar.style.width = '0%';
            
            // Read PDF content
            const pdfText = await readPdfContent(file);
            window.globalState.billText = pdfText;
            
            // Update progress
            progressBar.style.width = '50%';
            progressText.textContent = 'Analyzing bill...';
            
            // Get analysis from OpenAI
            const analysis = await OpenAIService.analyzeBill(pdfText, window.globalState.selectedPersona);
            window.globalState.billAnalysis = analysis;
            
            // Update progress
            progressBar.style.width = '100%';
            progressText.textContent = 'Analysis complete!';
            
            // Hide progress and loading overlay
            setTimeout(() => {
                uploadProgress.classList.add('hidden');
                toggleLoading(false);
                
                // Display results
                displayAnalysis(analysis);
            }, 500);
            
        } catch (error) {
            console.error('Error processing PDF:', error);
            alert('Error processing PDF. Please try again.');
            uploadProgress.classList.add('hidden');
            toggleLoading(false);
        }
    }

    // Update the readPdfContent function
    async function readPdfContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async function(event) {
                try {
                    const pdfData = new Uint8Array(event.target.result);
                    const loadingTask = pdfjsLib.getDocument({ data: pdfData });
                    const pdf = await loadingTask.promise;
                    
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map(item => item.str).join(' ');
                        fullText += pageText + '\n';
                    }
                    
                    resolve(fullText);
                } catch (error) {
                    console.error('Error reading PDF:', error);
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                console.error('FileReader error:', error);
                reject(error);
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    // Update the ENERGY_TERMS array with the new terms
    const ENERGY_TERMS = [
        // Basic Units and Measurements
        'kWh', 'Kilowatt-Hour', 'kilowatt-hour', 'MW', 'megawatt', 'voltage', 'ampere', 'wattage',
        
        // Billing Components
        'Demand Charge', 'demand charge',
        'Fixed Charge', 'fixed charge',
        'Basic Service Charge', 'basic service charge',
        'Energy Charge', 'energy charge',
        'Customer Charge', 'customer charge',
        'Meter Charge', 'meter charge',
        'System Benefit Charge', 'system benefit charge',
        'Capacity Charge', 'capacity charge',
        'Fuel Adjustment Charge', 'fuel adjustment charge',
        'Renewable Energy Charge', 'renewable energy charge',
        'Rate Rider', 'rate rider',
        
        // Time-based Usage Terms
        'Time-of-Use', 'TOU', 'time-of-use',
        'On-Peak', 'on-peak',
        'Off-Peak', 'off-peak',
        'Mid-Peak', 'mid-peak',
        'Shoulder Usage', 'shoulder usage',
        'Usage Tier', 'usage tier',
        'peak demand', 'shoulder period', 'load profile',
        'peak hours', 'off-peak hours', 'baseload', 'demand response',
        
        // Delivery and Infrastructure Charges
        'Transmission Charge', 'transmission charge',
        'Distribution Charge', 'distribution charge',
        'Generation Charge', 'generation charge',
        'Supply Charge', 'supply charge',
        
        // Metering and Reading
        'Net Metering', 'net metering',
        'smart meter', 'meter reading', 'interval data', 'consumption data',
        'real-time monitoring', 'digital meter',
        
        // Energy Efficiency Terms
        'energy efficiency', 'power factor', 'load shifting', 'energy audit',
        'weatherization', 'insulation rating', 'energy star rating', 'standby power',
        
        // Renewable Energy Terms
        'renewable energy', 'solar power', 'wind energy', 'battery storage',
        'grid electricity', 'grid-tied', 'off-grid', 'solar credits',
        
        // Environmental Impact
        'carbon footprint', 'greenhouse gas', 'emissions', 'carbon offset',
        'environmental levy', 'green energy', 'renewable percentage',
        
        // Technical Terms
        'load balancing', 'power quality', 'grid stability', 'frequency',
        'power surge', 'brownout', 'blackout', 'circuit', 'phase',
        
        // Energy Management
        'load management', 'energy monitoring', 'automation', 'smart home',
        'energy storage', 'backup power', 'generator', 'UPS'
    ];

    // Add assessment data
    const PERSONA_ASSESSMENTS = {
        'cost-conscious': {
            annualUsage: '3,500 – 4,500 kWh',
            dailyPattern: 'Aim to reduce peak-time usage, targeting low-usage times, such as mid-day and late night.',
            strategies: 'Favor time-of-use rates, load-shifting to off-peak hours, and energy-saving appliances.',
            considerations: 'May participate in incentive programs or concession schemes to lower costs.'
        },
        'eco-conscious': {
            annualUsage: '4,000 – 5,500 kWh (can be offset by solar production)',
            dailyPattern: 'Likely to leverage solar power generation (up to 5 – 10 kWh per day from a small to medium-sized solar system)',
            strategies: 'Invest in energy-efficient appliances, battery storage, and home insulation.',
            considerations: 'May participate in green energy programs, install smart meters, or track emissions impact.'
        },
        'tech-enthusiast': {
            annualUsage: '5,000 – 6,500 kWh',
            dailyPattern: 'Peak usage likely in evenings (2-3 kWh/hour), with consistent base usage from smart devices.',
            strategies: 'Employ energy management tools, smart thermostats, automation, and EV charging optimization.',
            considerations: 'Favor providers offering apps for usage monitoring and customizable control.'
        },
        'rural': {
            annualUsage: '6,000 – 8,000 kWh',
            dailyPattern: 'Even, steady usage across the day due to reliance on electric-powered utilities.',
            strategies: 'Often rely on backup solutions, off-grid power solutions, and high-capacity batteries.',
            considerations: 'Limited provider choices, higher costs due to infrastructure needs.'
        },
        'cald': {
            annualUsage: '3,500 – 5,000 kWh',
            dailyPattern: 'Usage varies widely, peak during meal preparation times.',
            strategies: 'Energy-saving behavior, though barriers may exist in understanding programs.',
            considerations: 'Need culturally tailored support and multilingual information.'
        }
    };

    // Add this helper function to extract numbers from text
    function extractNumber(text) {
        const match = text.match(/(\d+(?:,\d+)?(?:\.\d+)?)/);
        return match ? parseFloat(match[0].replace(',', '')) : null;
    }

    // Update the compareUsage function
    function compareUsage(actualUsage, personaProfile) {
        // Check if we have valid inputs
        if (!actualUsage || !personaProfile || !personaProfile.annualUsage) {
            return {
                comparisonText: 'Unable to compare usage - insufficient data',
                usageCategory: 'unknown',
                annualEstimate: 0,
                assessmentClass: ''
            };
        }

        try {
            const [minUsage, maxUsage] = personaProfile.annualUsage
                .split('–')
                .map(num => parseFloat(num.replace(/[^0-9.]/g, '')));
            
            // Convert actual monthly usage to annual estimate
            const annualEstimate = actualUsage * 12;
            
            let comparisonText = '';
            let usageCategory = '';
            
            if (annualEstimate < minUsage) {
                const percentBelow = ((minUsage - annualEstimate) / minUsage * 100).toFixed(1);
                comparisonText = `Your estimated annual usage (${annualEstimate.toFixed(0)} kWh) is ${percentBelow}% below typical range for your profile (${minUsage}-${maxUsage} kWh)`;
                usageCategory = 'below';
            } else if (annualEstimate > maxUsage) {
                const percentAbove = ((annualEstimate - maxUsage) / maxUsage * 100).toFixed(1);
                comparisonText = `Your estimated annual usage (${annualEstimate.toFixed(0)} kWh) is ${percentAbove}% above typical range for your profile (${minUsage}-${maxUsage} kWh)`;
                usageCategory = 'above';
            } else {
                comparisonText = `Your estimated annual usage (${annualEstimate.toFixed(0)} kWh) is within the typical range for your profile (${minUsage}-${maxUsage} kWh)`;
                usageCategory = 'within';
            }
            
            let assessmentClass = '';
            if (usageCategory === 'above') assessmentClass = 'assessment-high';
            else if (usageCategory === 'below') assessmentClass = 'assessment-low';
            else assessmentClass = 'assessment-normal';
            
            return { comparisonText, usageCategory, annualEstimate, assessmentClass };
        } catch (error) {
            console.error('Error comparing usage:', error);
            return {
                comparisonText: 'Unable to compare usage at this time',
                usageCategory: 'unknown',
                annualEstimate: 0,
                assessmentClass: ''
            };
        }
    }

    // Update the displayAnalysis function
    function displayAnalysis(analysis) {
        let resultsSection = document.querySelector('.results-section');
        if (!resultsSection) {
            resultsSection = document.createElement('section');
            resultsSection.classList.add('results-section');
            uploadSection.after(resultsSection);
        }

        // Add simplify button
        const simplifyBtnHTML = `
            <div class="simplify-controls">
                <button class="simplify-btn ${window.globalState.isSimplifiedView ? 'active' : ''}">
                    ${window.globalState.isSimplifiedView ? 'Standard View' : 'Simplified View'}
                </button>
            </div>
        `;

        // Extract usage from analysis
        const usageMatch = analysis.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*kWh/i);
        const actualUsage = usageMatch ? extractNumber(usageMatch[0]) : null;

        // Get persona assessment if available
        const assessment = window.globalState.selectedPersona ? 
            PERSONA_ASSESSMENTS[window.globalState.selectedPersona] : null;
        
        // Compare usage with persona profile if both are available
        const usageComparison = (actualUsage && assessment) ? 
            compareUsage(actualUsage, assessment) : 
            {
                comparisonText: 'Usage comparison not available',
                usageCategory: 'unknown',
                annualEstimate: 0,
                assessmentClass: ''
            };

        // Extract key information for simplified view
        const keyInfo = {
            totalUsage: analysis.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*kWh/i)?.[0] || 'Not found',
            totalCost: analysis.match(/\$\s*(\d+(?:,\d+)?(?:\.\d+)?)/)?.[0] || 'Not found',
            mainRecommendations: []
        };

        if (window.globalState.isSimplifiedView) {
            // Extract quick wins without dashes
            const quickWinsMatch = analysis.match(/Quick Wins:([^]*?)(?=Long-term|$)/i);
            if (quickWinsMatch) {
                const recommendations = quickWinsMatch[1]
                    .split('\n')
                    .map(line => line.replace(/^[-–—•*]\s*/, '').trim()) // Remove any type of bullet or dash
                    .filter(line => line && line.length > 0 && !line.match(/^[:\s]*$/)) // Remove empty lines and lines with only colons or spaces
                    .slice(0, 3); // Take first 3 non-empty recommendations

                // Only assign if we have valid recommendations
                if (recommendations.length > 0) {
                    keyInfo.mainRecommendations = recommendations;
                } else {
                    keyInfo.mainRecommendations = ['No specific recommendations available'];
                }
            } else {
                keyInfo.mainRecommendations = ['No recommendations available'];
            }

            const simplifiedHTML = `
                <div class="results-container">
                    ${simplifyBtnHTML}
                    <div class="analysis-section simplified">
                        <h3>Your Energy Usage</h3>
                        <div class="usage-comparison ${usageComparison.usageCategory}">
                            ${usageComparison.comparisonText}
                        </div>
                        <table class="analysis-table">
                            <tr>
                                <td class="label">Monthly Usage</td>
                                <td class="value">${keyInfo.totalUsage}</td>
                            </tr>
                            <tr>
                                <td class="label">Total Cost</td>
                                <td class="value">${keyInfo.totalCost}</td>
                            </tr>
                        </table>
                    </div>

                    <div class="analysis-section simplified">
                        <h3>Top Recommendations</h3>
                        ${keyInfo.mainRecommendations
                            .filter(rec => rec && rec.trim().length > 0 && !rec.match(/^[:\s*]*$/))
                            .map(rec => `
                                <div class="recommendation-item">
                                    <span>${rec}</span>
                                    <button class="action tell-more" data-recommendation="${rec}">Tell me more</button>
                                </div>
                            `).join('')}
                    </div>
                </div>
            `;
            resultsSection.innerHTML = simplifiedHTML;

            // Add click handlers for "Tell me more" buttons
            const tellMoreButtons = resultsSection.querySelectorAll('.tell-more');
            tellMoreButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const recommendation = button.getAttribute('data-recommendation');
                    const chatInput = document.querySelector('.chat-input input');
                    const sendButton = document.querySelector('.send-message');
                    const chatbotContainer = document.querySelector('.chatbot-container');
                    
                    // Show chatbot if hidden
                    chatbotContainer.classList.remove('hidden');
                    chatbotContainer.classList.remove('minimized');
                    
                    // Set the question
                    chatInput.value = `Tell me more about "${recommendation}"`;
                    
                    // Send the message
                    sendButton.click();
                    
                    // Scroll chatbot into view
                    chatbotContainer.scrollIntoView({ behavior: 'smooth' });
                });
            });
        } else {
            // For standard view
            const cleanAnalysis = analysis
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/#{1,6}\s/g, '')
                .replace(/XX/g, '')
                .trim();

            // Create assessment HTML with comparison only if assessment data exists
            const assessmentHTML = assessment ? `
                <div class="analysis-section assessment-section ${window.globalState.isSimplifiedView ? 'simplified' : ''}">
                    <h3>Usage Assessment</h3>
                    <table class="analysis-table">
                        <tbody>
                            <tr>
                                <td class="label">Usage Comparison</td>
                                <td class="value ${usageComparison.usageCategory}">
                                    ${usageComparison.comparisonText}
                                </td>
                            </tr>
                            <tr>
                                <td class="label">Typical Annual Usage</td>
                                <td class="value">${assessment.annualUsage}</td>
                            </tr>
                            <tr>
                                <td class="label">Usage Pattern</td>
                                <td class="value">${assessment.dailyPattern}</td>
                            </tr>
                            <tr>
                                <td class="label">Recommended Strategies</td>
                                <td class="value">${assessment.strategies}</td>
                            </tr>
                            <tr>
                                <td class="label">Key Considerations</td>
                                <td class="value">${assessment.considerations}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ` : '';

            const sections = cleanAnalysis.split('\n\n');
            
            let formattedHTML = '<div class="results-container">';
            formattedHTML += simplifyBtnHTML;
            if (assessment) {
                formattedHTML += assessmentHTML;
            }
            
            sections.forEach(section => {
                if (window.globalState.isSimplifiedView && section.toLowerCase().includes('technical')) {
                    return;
                }

                if (section.includes(':')) {
                    const [title, ...content] = section.split('\n');
                    formattedHTML += `
                        <div class="analysis-section ${window.globalState.isSimplifiedView ? 'simplified' : ''}">
                            <h3>${makeTermsClickable(title.replace(':', ''))}</h3>
                            <table class="analysis-table">
                                <tbody>
                                    ${formatTableContent(content.join('\n'), window.globalState.isSimplifiedView)}
                                </tbody>
                            </table>
                        </div>
                    `;
                } else {
                    formattedHTML += `
                        <div class="analysis-section ${window.globalState.isSimplifiedView ? 'simplified' : ''}">
                            <p>${makeTermsClickable(section)}</p>
                        </div>
                    `;
                }
            });

            formattedHTML += '</div>';
            resultsSection.innerHTML = formattedHTML;
        }

        // Add click handlers
        addTermClickHandlers(resultsSection);
        
        // Add simplify button click handler
        const simplifyBtn = resultsSection.querySelector('.simplify-btn');
        simplifyBtn.addEventListener('click', toggleSimplifiedView);
    }

    // Add list of comparative terms
    const COMPARATIVE_TERMS = [
        'average', 'higher', 'lower', 'expected', 'typical', 'normal',
        'increased', 'decreased', 'more than', 'less than', 'above',
        'below', 'exceeds', 'reduced', 'excessive', 'minimal',
        'maximum', 'minimum', 'optimal', 'recommended', 'standard'
    ];

    // Update makeTermsClickable function
    function makeTermsClickable(text) {
        if (!text) return '';
        
        let processedText = text;
        
        // Handle energy terms
        ENERGY_TERMS.forEach(term => {
            const regex = new RegExp(`\\b(${term})\\b`, 'gi');
            processedText = processedText.replace(regex, '<span class="clickable-term">$1</span>');
        });
        
        // Handle comparative terms
        COMPARATIVE_TERMS.forEach(term => {
            const regex = new RegExp(`\\b(${term})\\b`, 'gi');
            processedText = processedText.replace(regex, '<span class="comparative-term">$1</span>');
        });
        
        return processedText;
    }

    // Update formatTableContent function to more thoroughly remove dashes
    function formatTableContent(content) {
        if (!content) return '';
        
        const lines = content.split('\n').filter(line => line.trim());
        
        return lines.map(line => {
            // Remove any type of dash, bullet point, or similar characters from the start of the line
            // This includes regular dashes, en dashes, em dashes, bullets, and asterisks
            const cleanLine = line
                .replace(/^[-–—•*]\s*/g, '')  // Remove from start of line
                .replace(/^\s*[-–—•*]\s*/g, '')  // Remove if there's leading whitespace
                .replace(/^[•]\s*/g, '')  // Remove bullet points
                .trim();
            
            if (cleanLine.includes(':')) {
                const [key, value] = cleanLine.split(':').map(str => str.trim());
                return `
                    <tr>
                        <td class="label">${makeTermsClickable(key)}</td>
                        <td class="value">${makeTermsClickable(value)}</td>
                    </tr>
                `;
            } else {
                return `
                    <tr>
                        <td colspan="2" class="value">${makeTermsClickable(cleanLine)}</td>
                    </tr>
                `;
            }
        }).join('');
    }

    function addTermClickHandlers(container) {
        const terms = container.querySelectorAll('.clickable-term');
        terms.forEach(term => {
            term.addEventListener('click', () => {
                // Get the chatbot input and send button
                const chatInput = document.querySelector('.chat-input input');
                const sendButton = document.querySelector('.send-message');
                
                // Make sure chatbot is visible
                const chatbotContainer = document.querySelector('.chatbot-container');
                chatbotContainer.classList.remove('hidden');
                
                // Set the question in the input
                const question = `What does '${term.textContent}' mean?`;
                chatInput.value = question;
                
                // Trigger the send button
                sendButton.click();
                
                // Scroll chatbot into view
                chatbotContainer.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    // Add after displayAnalysis function
    function toggleSimplifiedView() {
        window.globalState.isSimplifiedView = !window.globalState.isSimplifiedView;
        const simplifyBtn = document.querySelector('.simplify-btn');
        simplifyBtn.textContent = window.globalState.isSimplifiedView ? 'Standard View' : 'Simplified View';
        
        // Re-display the analysis with new view mode
        if (window.globalState.billAnalysis) {
            displayAnalysis(window.globalState.billAnalysis);
        }
    }
}); 