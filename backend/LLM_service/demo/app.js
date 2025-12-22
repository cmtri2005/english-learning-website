// API Configuration
const API_BASE_URL = 'http://localhost:8002';

// State
let currentSpeakingTopic = null;
let currentWritingTopic = null;

// Audio Recording State
let mediaRecorder = null;
let audioChunks = [];
let recordedBlob = null;
let recordingStartTime = null;
let recordingTimer = null;

// ========== UTILS ==========
async function apiRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'API Error');
    }
    return response.json();
}

function showLoading(id) {
    document.getElementById(id).classList.add('show');
}

function hideLoading(id) {
    document.getElementById(id).classList.remove('show');
}

function showResult(id, success = true) {
    const el = document.getElementById(id);
    el.classList.add('show');
    el.classList.remove('error', 'success');
    el.classList.add(success ? 'success' : 'error');
}

function hideResult(id) {
    document.getElementById(id).classList.remove('show');
}

// ========== TABS ==========
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.panel).classList.add('active');
    });
});

// ========== HEALTH CHECK ==========
async function checkAPIHealth() {
    const statusEl = document.getElementById('apiStatus');
    try {
        const data = await apiRequest('/health');
        statusEl.textContent = 'API Connected';
        statusEl.className = 'api-status connected';
    } catch (e) {
        statusEl.textContent = 'API Disconnected';
        statusEl.className = 'api-status disconnected';
    }
}

// ========== SPEAKING ==========
document.getElementById('getSpeakingTopic').addEventListener('click', async () => {
    hideResult('speakingResult');
    showLoading('speakingLoading');
    
    try {
        const data = await apiRequest('/speaking/topic', 'POST', {});
        currentSpeakingTopic = data;
        
        document.getElementById('speakingTestName').textContent = data.test_name;
        document.getElementById('speakingContext').textContent = data.context;
        document.getElementById('speakingTopicDisplay').style.display = 'block';
        document.getElementById('audioRecordSection').style.display = 'block';
        document.getElementById('speakingTranscriptGroup').style.display = 'block';
        document.getElementById('evaluateButtons').style.display = 'block';
        document.getElementById('speakingTranscript').value = '';
        
        // Reset recording
        recordedBlob = null;
        document.getElementById('audioPlayback').style.display = 'none';
        document.getElementById('playRecording').style.display = 'none';
    } catch (e) {
        alert('Error: ' + e.message);
    } finally {
        hideLoading('speakingLoading');
    }
});

// ========== AUDIO RECORDING ==========
document.getElementById('startRecording').addEventListener('click', async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (e) => {
            audioChunks.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
            recordedBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(recordedBlob);
            document.getElementById('audioPlayback').src = audioUrl;
            document.getElementById('audioPlayback').style.display = 'block';
            document.getElementById('playRecording').style.display = 'inline-block';
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        recordingStartTime = Date.now();
        
        // Update UI
        document.getElementById('startRecording').style.display = 'none';
        document.getElementById('stopRecording').style.display = 'inline-block';
        document.getElementById('recordingStatus').style.display = 'block';
        document.getElementById('recordingText').textContent = '🔴 Recording...';
        
        // Start timer
        recordingTimer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
            const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const secs = (elapsed % 60).toString().padStart(2, '0');
            document.getElementById('recordingTime').textContent = `${mins}:${secs}`;
        }, 1000);
        
    } catch (e) {
        alert('Microphone access denied. Please allow microphone access.');
    }
});

document.getElementById('stopRecording').addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        clearInterval(recordingTimer);
        
        // Update UI
        document.getElementById('startRecording').style.display = 'inline-block';
        document.getElementById('stopRecording').style.display = 'none';
        document.getElementById('recordingStatus').style.display = 'none';
    }
});

document.getElementById('playRecording').addEventListener('click', () => {
    document.getElementById('audioPlayback').play();
});

// Handle file upload
document.getElementById('audioFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        recordedBlob = file;
        const audioUrl = URL.createObjectURL(file);
        document.getElementById('audioPlayback').src = audioUrl;
        document.getElementById('audioPlayback').style.display = 'block';
        document.getElementById('playRecording').style.display = 'inline-block';
    }
});

// ========== EVALUATE SPEAKING WITH AUDIO ==========
document.getElementById('evaluateSpeakingAudio').addEventListener('click', async () => {
    if (!recordedBlob) {
        alert('Please record or upload an audio file first.');
        return;
    }
    if (!currentSpeakingTopic) {
        alert('Please get a topic first.');
        return;
    }

    hideResult('speakingResult');
    showLoading('speakingLoading');
    document.getElementById('speakingLoadingText').textContent = 'Step 1/4: Transcribing audio...';

    try {
        const formData = new FormData();
        formData.append('audio', recordedBlob, 'recording.webm');
        formData.append('topic_id', currentSpeakingTopic.topic_id);
        formData.append('topic_context', currentSpeakingTopic.context);

        document.getElementById('speakingLoadingText').textContent = 'Analyzing with 4 layers...';

        const response = await fetch(`${API_BASE_URL}/speaking/evaluate-audio`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Evaluation failed');
        }

        const data = await response.json();
        displaySpeakingResults(data);

    } catch (e) {
        alert('Error: ' + e.message);
    } finally {
        hideLoading('speakingLoading');
    }
});

// ========== EVALUATE SPEAKING WITH TEXT ==========
document.getElementById('evaluateSpeakingText').addEventListener('click', async () => {
    const transcript = document.getElementById('speakingTranscript').value.trim();
    if (!transcript) {
        alert('Please enter your response transcript.');
        return;
    }
    if (!currentSpeakingTopic) {
        alert('Please get a topic first.');
        return;
    }

    hideResult('speakingResult');
    showLoading('speakingLoading');
    document.getElementById('speakingLoadingText').textContent = 'Evaluating transcript...';

    try {
        const data = await apiRequest('/speaking/evaluate-full', 'POST', {
            topic_id: currentSpeakingTopic.topic_id,
            transcript: transcript
        });

        displaySpeakingResults(data);

    } catch (e) {
        alert('Error: ' + e.message);
    } finally {
        hideLoading('speakingLoading');
    }
});

// ========== DISPLAY SPEAKING RESULTS ==========
function displaySpeakingResults(data) {
    if (!data.success) {
        document.getElementById('speakingScores').innerHTML = `
            <div style="color: #dc3545; padding: 20px;">
                Evaluation failed: ${data.error || 'Unknown error'}
            </div>
        `;
        showResult('speakingResult', false);
        return;
    }

    // Show transcript
    if (data.transcript) {
        document.getElementById('transcriptSection').style.display = 'block';
        document.getElementById('transcriptText').textContent = data.transcript;
    }

    // Display scores
    const scores = data.scores || {};
    const scoresHtml = `
        <div class="score-item">
            <div class="score">${(scores.pronunciation || 0).toFixed(1)}</div>
            <div class="label">Pronunciation</div>
        </div>
        <div class="score-item">
            <div class="score">${(scores.fluency || 0).toFixed(1)}</div>
            <div class="label">Fluency</div>
        </div>
        <div class="score-item">
            <div class="score">${(scores.grammar || 0).toFixed(1)}</div>
            <div class="label">Grammar</div>
        </div>
        <div class="score-item">
            <div class="score">${(scores.vocabulary || 0).toFixed(1)}</div>
            <div class="label">Vocabulary</div>
        </div>
        <div class="score-item">
            <div class="score">${(scores.content || 0).toFixed(1)}</div>
            <div class="label">Content</div>
        </div>
        <div class="score-item">
            <div class="score">${(scores.topic_matching || 0).toFixed(1)}</div>
            <div class="label">Topic Match</div>
        </div>
        <div class="score-item">
            <div class="score" style="color: #28a745; font-size: 2.5rem;">${(scores.overall || 0).toFixed(1)}</div>
            <div class="label">Overall</div>
        </div>
    `;
    document.getElementById('speakingScores').innerHTML = scoresHtml;

    // Display layer details
    let layerHtml = '';
    const layers = data.layers || {};
    
    // Layer 2: Pronunciation & Fluency
    if (layers.pronunciation_fluency && !layers.pronunciation_fluency.error) {
        const pf = layers.pronunciation_fluency;
        layerHtml += `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h4>Layer 2: Pronunciation & Fluency</h4>
                <p><strong>Pronunciation:</strong> ${pf.pronunciation_feedback || ''}</p>
                <p><strong>Fluency:</strong> ${pf.fluency_feedback || ''}</p>
                ${pf.vietnamese_specific_tips && pf.vietnamese_specific_tips.length > 0 ? `
                    <div style="background: #fff3e0; padding: 10px; border-radius: 6px; margin-top: 10px;">
                        <strong>Tips for Vietnamese Learners:</strong>
                        <ul style="margin: 5px 0 0 20px;">
                            ${pf.vietnamese_specific_tips.map(t => `<li>${t}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Layer 3: Grammar & Content
    if (layers.grammar_content && !layers.grammar_content.error) {
        const gc = layers.grammar_content;
        layerHtml += `
            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <h4>📝 Layer 3: Grammar & Content</h4>
                <p><strong>Grammar:</strong> ${gc.grammar_feedback || ''}</p>
                <p><strong>Vocabulary:</strong> ${gc.vocabulary_feedback || ''}</p>
                <p><strong>Content:</strong> ${gc.content_feedback || ''}</p>
                <p><strong>Topic Matching:</strong> ${gc.matching_analysis || ''}</p>
            </div>
        `;
    }
    
    document.getElementById('layerDetails').innerHTML = layerHtml;

    // Display feedback
    const feedback = data.feedback || {};
    let feedbackHtml = '';
    
    if (feedback.summary) {
        feedbackHtml += `<h4>📋 Summary</h4><p>${feedback.summary}</p>`;
    }
    
    if (feedback.strengths && feedback.strengths.length > 0) {
        feedbackHtml += `
            <h4 style="margin-top: 15px; color: #28a745;">✅ Strengths</h4>
            <ul>${feedback.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
        `;
    }
    
    if (feedback.errors && feedback.errors.length > 0) {
        feedbackHtml += '<h4 style="margin-top: 15px; color: #dc3545;">Errors Found</h4>';
        feedback.errors.forEach(err => {
            feedbackHtml += `
                <div class="error-item">
                    <div class="type">${err.type || 'error'}</div>
                    <div class="text"><strong>Issue:</strong> ${err.text || err.issue || ''}</div>
                    ${err.correction ? `<div class="correction"><strong>Correction:</strong> ${err.correction}</div>` : ''}
                    ${err.suggestion ? `<div><em>Suggestion: ${err.suggestion}</em></div>` : ''}
                    ${err.rule ? `<div><em>Rule: ${err.rule}</em></div>` : ''}
                </div>
            `;
        });
    }

    if (feedback.suggestions && feedback.suggestions.length > 0) {
        feedbackHtml += `
            <h4 style="margin-top: 15px;">Suggestions</h4>
            <ul>${feedback.suggestions.map(s => `<li>${s}</li>`).join('')}</ul>
        `;
    }
    
    if (feedback.vietnamese_tips && feedback.vietnamese_tips.length > 0) {
        feedbackHtml += `
            <h4 style="margin-top: 15px;">🇻🇳 Vietnamese Learner Tips</h4>
            <ul>${feedback.vietnamese_tips.map(t => `<li>${t}</li>`).join('')}</ul>
        `;
    }

    document.getElementById('speakingFeedback').innerHTML = feedbackHtml;
    showResult('speakingResult');
}

// ========== WRITING ==========
document.getElementById('topicType').addEventListener('change', (e) => {
    const categoryGroup = document.getElementById('categoryGroup');
    if (e.target.value === 'custom' || e.target.value === 'generated') {
        categoryGroup.style.display = 'block';
    } else {
        categoryGroup.style.display = 'none';
    }
});

document.getElementById('getWritingTopic').addEventListener('click', async () => {
    hideResult('writingResult');
    showLoading('writingLoading');

    const topicType = document.getElementById('topicType').value;
    const category = document.getElementById('category').value;

    try {
        const data = await apiRequest('/writing/topic', 'POST', {
            topic_type: topicType,
            category: category || null
        });
        currentWritingTopic = data;

        document.getElementById('writingTestName').textContent = data.test_name || `${data.category} - ${data.prompt_type}`;
        document.getElementById('writingContext').textContent = data.context;
        document.getElementById('writingTopicDisplay').style.display = 'block';
        document.getElementById('writingEssayGroup').style.display = 'block';
        document.getElementById('evaluateWriting').style.display = 'inline-block';
        document.getElementById('writingEssay').value = '';
    } catch (e) {
        alert('Error: ' + e.message);
    } finally {
        hideLoading('writingLoading');
    }
});

document.getElementById('evaluateWriting').addEventListener('click', async () => {
    const essay = document.getElementById('writingEssay').value.trim();
    if (!essay) {
        alert('Please write your essay.');
        return;
    }
    if (!currentWritingTopic) {
        alert('Please get a topic first.');
        return;
    }

    hideResult('writingResult');
    showLoading('writingLoading');

    try {
        const data = await apiRequest('/writing/evaluate', 'POST', {
            topic_id: currentWritingTopic.topic_id,
            topic_context: currentWritingTopic.context,
            essay: essay
        });

        // Display scores
        const scoresHtml = `
            <div class="score-item">
                <div class="score">${data.task_achievement_score?.toFixed(1) || 'N/A'}</div>
                <div class="label">Task Achievement</div>
            </div>
            <div class="score-item">
                <div class="score">${data.coherence_cohesion_score?.toFixed(1) || 'N/A'}</div>
                <div class="label">Coherence & Cohesion</div>
            </div>
            <div class="score-item">
                <div class="score">${data.lexical_resource_score?.toFixed(1) || 'N/A'}</div>
                <div class="label">Lexical Resource</div>
            </div>
            <div class="score-item">
                <div class="score">${data.grammar_accuracy_score?.toFixed(1) || 'N/A'}</div>
                <div class="label">Grammar Accuracy</div>
            </div>
            <div class="score-item">
                <div class="score" style="color: #28a745; font-size: 2.5rem;">${data.overall_score?.toFixed(1) || 'N/A'}</div>
                <div class="label">Overall</div>
            </div>
        `;
        document.getElementById('writingScores').innerHTML = scoresHtml;

        // Display feedback
        let feedbackHtml = '';
        
        if (data.matching_analysis) {
            feedbackHtml += `<h4>Topic Matching Analysis</h4><p>${data.matching_analysis}</p>`;
        }
        
        feedbackHtml += `<h4 style="margin-top: 15px;">Feedback</h4><p>${data.feedback || 'No feedback available.'}</p>`;
        
        if (data.errors && data.errors.length > 0) {
            feedbackHtml += '<h4 style="margin-top: 15px;">Errors Found</h4>';
            data.errors.forEach(err => {
                feedbackHtml += `
                    <div class="error-item">
                        <div class="type">${err.type}</div>
                        <div class="text"><strong>Error:</strong> ${err.text}</div>
                        <div class="correction"><strong>Correction:</strong> ${err.correction}</div>
                        ${err.explanation ? `<div><em>${err.explanation}</em></div>` : ''}
                    </div>
                `;
            });
        }

        if (data.suggestions && data.suggestions.length > 0) {
            feedbackHtml += '<h4 style="margin-top: 15px;">Suggestions</h4><ul>';
            data.suggestions.forEach(s => {
                feedbackHtml += `<li>${s}</li>`;
            });
            feedbackHtml += '</ul>';
        }

        if (data.improved_version) {
            feedbackHtml += `<h4 style="margin-top: 15px;">Improved Version</h4><p style="background: #e8f5e9; padding: 15px; border-radius: 8px;">${data.improved_version}</p>`;
        }

        document.getElementById('writingFeedback').innerHTML = feedbackHtml;
        showResult('writingResult');
    } catch (e) {
        alert('Error: ' + e.message);
    } finally {
        hideLoading('writingLoading');
    }
});

// ========== PRONUNCIATION ==========
document.getElementById('lookupPronunciation').addEventListener('click', async () => {
    const word = document.getElementById('word').value.trim();
    if (!word) {
        alert('Please enter a word.');
        return;
    }

    hideResult('pronunciationResult');
    showLoading('pronunciationLoading');

    try {
        const data = await apiRequest(`/pronunciation/${encodeURIComponent(word)}`);
        
        document.getElementById('pronunciationWord').textContent = data.word;
        
        if (data.found && data.ipa) {
            document.getElementById('pronunciationIPA').textContent = `/${data.ipa}/`;
            document.getElementById('pronunciationIPA').className = 'ipa';
            
            // Show audio player
            document.getElementById('pronunciationAudio').style.display = 'block';
            
            // Set up audio player
            const audioElement = document.getElementById('audioElement');
            const audioUrl = `${API_BASE_URL}/pronunciation/${encodeURIComponent(word)}/audio`;
            audioElement.src = audioUrl;
            
        } else {
            document.getElementById('pronunciationIPA').textContent = 'Pronunciation not found in database';
            document.getElementById('pronunciationIPA').className = 'ipa not-found';
            document.getElementById('pronunciationAudio').style.display = 'none';
        }
        
        showResult('pronunciationResult');
    } catch (e) {
        alert('Error: ' + e.message);
    } finally {
        hideLoading('pronunciationLoading');
    }
});

// Play pronunciation audio
document.getElementById('playPronunciation').addEventListener('click', () => {
    const audioElement = document.getElementById('audioElement');
    const playBtn = document.getElementById('playPronunciation');
    
    playBtn.disabled = true;
    playBtn.textContent = '⏳ Loading...';
    
    audioElement.oncanplay = () => {
        playBtn.textContent = '🔊 Playing...';
        audioElement.play();
    };
    
    audioElement.onended = () => {
        playBtn.disabled = false;
        playBtn.textContent = '🔊 Play Pronunciation';
    };
    
    audioElement.onerror = () => {
        playBtn.disabled = false;
        playBtn.textContent = 'Audio Error';
        setTimeout(() => {
            playBtn.textContent = 'Play Pronunciation';
        }, 2000);
    };
    
    // Trigger loading
    audioElement.load();
});

// Enter key support
document.getElementById('word').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('lookupPronunciation').click();
    }
});

// ========== TOPICS LIST ==========
document.getElementById('loadTopics').addEventListener('click', async () => {
    hideResult('topicsResult');
    showLoading('topicsLoading');

    try {
        const data = await apiRequest('/topics');
        
        // Speaking topics
        const speakingList = document.getElementById('speakingTopicsList');
        speakingList.innerHTML = '';
        if (data.speaking_topics && data.speaking_topics.length > 0) {
            data.speaking_topics.forEach(t => {
                const li = document.createElement('li');
                li.textContent = `${t.id}: ${t.name}`;
                speakingList.appendChild(li);
            });
        } else {
            speakingList.innerHTML = '<li>No topics available</li>';
        }

        // Writing exam topics
        const writingExamList = document.getElementById('writingExamTopicsList');
        writingExamList.innerHTML = '';
        if (data.writing_exam_topics && data.writing_exam_topics.length > 0) {
            data.writing_exam_topics.forEach(t => {
                const li = document.createElement('li');
                li.textContent = `${t.id}: ${t.name}`;
                writingExamList.appendChild(li);
            });
        } else {
            writingExamList.innerHTML = '<li>No topics available</li>';
        }

        // Custom writing topics
        const writingCustomList = document.getElementById('writingCustomTopicsList');
        writingCustomList.innerHTML = '';
        if (data.writing_custom_topics && data.writing_custom_topics.length > 0) {
            data.writing_custom_topics.forEach(t => {
                const li = document.createElement('li');
                li.textContent = `${t.id}: ${t.category} (${t.type})`;
                writingCustomList.appendChild(li);
            });
        } else {
            writingCustomList.innerHTML = '<li>No topics available</li>';
        }

        showResult('topicsResult');
    } catch (e) {
        alert('Error: ' + e.message);
    } finally {
        hideLoading('topicsLoading');
    }
});

// ========== INIT ==========
checkAPIHealth();
setInterval(checkAPIHealth, 30000); // Check every 30 seconds
