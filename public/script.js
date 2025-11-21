class IELTSTest {
    constructor() {
        this.timer = 0;
        this.timerInterval = null;
        this.isTestStarted = false;
        this.warningGiven = false;
        this.currentScreen = 'task1';
        
        this.initializeElements();
        this.attachEventListeners();
        this.setupVisibilityChangeHandler();
    }

    initializeElements() {
        // Student info and timer
        this.studentName = document.getElementById('studentName');
        this.studentSurname = document.getElementById('studentSurname');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.startTestBtn = document.getElementById('startTestBtn');

        // Navigation
        this.task1Btn = document.getElementById('task1Btn');
        this.task2Btn = document.getElementById('task2Btn');
        this.task1Screen = document.getElementById('task1Screen');
        this.task2Screen = document.getElementById('task2Screen');

        // Task 1 elements
        this.task1Answer = document.getElementById('task1Answer');
        this.task1WordCount = document.getElementById('task1WordCount');
        this.nextToTask2 = document.getElementById('nextToTask2');

        // Task 2 elements
        this.task2QuestionImage = document.getElementById('task2QuestionImage');
        this.task2QuestionText = document.getElementById('task2QuestionText');
        this.task2QuestionDisplay = document.getElementById('task2QuestionDisplay');
        this.task2Answer = document.getElementById('task2Answer');
        this.task2WordCount = document.getElementById('task2WordCount');
        this.backToTask1 = document.getElementById('backToTask1');
        this.submitTest = document.getElementById('submitTest');

        // Modals
        this.warningModal = document.getElementById('warningModal');
        this.messageModal = document.getElementById('messageModal');
        this.modalOkBtn = document.getElementById('modalOkBtn');
        this.messageOkBtn = document.getElementById('messageOkBtn');
        this.messageTitle = document.getElementById('messageTitle');
        this.messageText = document.getElementById('messageText');
    }

    attachEventListeners() {
        // Test control
        this.startTestBtn.addEventListener('click', () => this.startTest());

        // Navigation
        this.task1Btn.addEventListener('click', () => this.showScreen('task1'));
        this.task2Btn.addEventListener('click', () => this.showScreen('task2'));
        this.nextToTask2.addEventListener('click', () => this.showScreen('task2'));
        this.backToTask1.addEventListener('click', () => this.showScreen('task1'));

        // Word count tracking
        this.task1Answer.addEventListener('input', () => this.updateWordCount('task1'));
        this.task2Answer.addEventListener('input', () => this.updateWordCount('task2'));

        // Task 2 question handling
        this.task2QuestionImage.addEventListener('change', (e) => this.handleTask2QuestionImage(e));
        this.task2QuestionText.addEventListener('input', () => this.handleTask2QuestionText());

        // Submission
        this.submitTest.addEventListener('click', () => this.submitAnswers());

        // Modal buttons
        this.modalOkBtn.addEventListener('click', () => this.hideWarningModal());
        this.messageOkBtn.addEventListener('click', () => this.hideMessageModal());
    }

    setupVisibilityChangeHandler() {
        // Handle tab/window visibility changes for anti-cheating
        document.addEventListener('visibilitychange', () => {
            if (this.isTestStarted && document.hidden) {
                this.handleVisibilityChange();
            }
        });

        // Also handle window blur (switching to other applications)
        window.addEventListener('blur', () => {
            if (this.isTestStarted) {
                this.handleVisibilityChange();
            }
        });
    }

    startTest() {
        if (!this.studentName.value.trim() || !this.studentSurname.value.trim()) {
            this.showMessage('Error', 'Please enter your name and surname before starting the test.');
            return;
        }

        this.isTestStarted = true;
        this.startTestBtn.disabled = true;
        this.studentName.readOnly = true;
        this.studentSurname.readOnly = true;

        // Start timer
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimerDisplay();
        }, 1000);

        this.showMessage('Test Started', 'Your test has started. Timer is now running.');
    }

    updateTimerDisplay() {
        const hours = Math.floor(this.timer / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((this.timer % 3600) / 60).toString().padStart(2, '0');
        const seconds = (this.timer % 60).toString().padStart(2, '0');
        this.timerDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    }

    showScreen(screen) {
        // Update navigation buttons
        this.task1Btn.classList.toggle('active', screen === 'task1');
        this.task2Btn.classList.toggle('active', screen === 'task2');

        // Update screens
        this.task1Screen.classList.toggle('active', screen === 'task1');
        this.task2Screen.classList.toggle('active', screen === 'task2');

        this.currentScreen = screen;
    }

    updateWordCount(task) {
        const textarea = task === 'task1' ? this.task1Answer : this.task2Answer;
        const wordCountElement = task === 'task1' ? this.task1WordCount : this.task2WordCount;
        
        const text = textarea.value.trim();
        const wordCount = text === '' ? 0 : text.split(/\s+/).length;
        wordCountElement.textContent = wordCount;
    }

    handleTask2QuestionImage(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.task2QuestionDisplay.innerHTML = `<img src="${e.target.result}" alt="Task 2 Question Image">`;
                this.task2QuestionText.value = ''; // Clear text if image is uploaded
            };
            reader.readAsDataURL(file);
        }
    }

    handleTask2QuestionText() {
        const text = this.task2QuestionText.value.trim();
        if (text) {
            this.task2QuestionDisplay.textContent = text;
            this.task2QuestionImage.value = ''; // Clear file input if text is entered
        } else if (!this.task2QuestionImage.files[0]) {
            this.task2QuestionDisplay.innerHTML = '';
        }
    }

    handleVisibilityChange() {
        if (!this.warningGiven) {
            // First violation - show warning
            this.warningGiven = true;
            this.showWarningModal();
        } else {
            // Second violation - reset test
            this.resetTestDueToCheating();
        }
    }

    showWarningModal() {
        this.warningModal.style.display = 'block';
    }

    hideWarningModal() {
        this.warningModal.style.display = 'none';
    }

    resetTestDueToCheating() {
        // Clear all answers
        this.task1Answer.value = '';
        this.task2Answer.value = '';
        this.task2QuestionImage.value = '';
        this.task2QuestionText.value = '';
        this.task2QuestionDisplay.innerHTML = '';

        // Reset word counts
        this.updateWordCount('task1');
        this.updateWordCount('task2');

        // Reset timer
        this.timer = 0;
        this.updateTimerDisplay();
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // Reset test state
        this.isTestStarted = false;
        this.warningGiven = false;
        this.startTestBtn.disabled = false;
        this.studentName.readOnly = false;
        this.studentSurname.readOnly = false;

        // Show reset message
        this.showMessage('Test Reset', 'Your test has been reset due to switching to another platform.');
    }

    async submitAnswers() {
        // Validation
        if (!this.studentName.value.trim() || !this.studentSurname.value.trim()) {
            this.showMessage('Error', 'Please enter your name and surname.');
            return;
        }

        if (!this.task1Answer.value.trim() && !this.task2Answer.value.trim()) {
            this.showMessage('Error', 'Please provide answers for at least one task.');
            return;
        }

        if (!this.isTestStarted) {
            this.showMessage('Error', 'Please start the test before submitting.');
            return;
        }

        // Prepare submission data
        const submissionData = {
            studentName: this.studentName.value.trim(),
            studentSurname: this.studentSurname.value.trim(),
            timerValue: this.timerDisplay.textContent,
            submittedAt: new Date().toISOString(),
            task1QuestionText: document.getElementById('task1Question').value,
            task1Answer: this.task1Answer.value,
            task2QuestionText: this.task2QuestionText.value,
            task2Answer: this.task2Answer.value,
            task2QuestionImageName: null,
            task2QuestionImageDataUrl: null
        };

        // Handle Task 2 question image if present
        if (this.task2QuestionImage.files[0]) {
            const file = this.task2QuestionImage.files[0];
            submissionData.task2QuestionImageName = file.name;
            
            // Convert image to data URL
            const dataUrl = await this.fileToDataURL(file);
            submissionData.task2QuestionImageDataUrl = dataUrl;
        }

        // Submit to API
        this.submitToAPI(submissionData);
    }

    fileToDataURL(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    async submitToAPI(data) {
        try {
            this.submitTest.disabled = true;
            this.submitTest.textContent = 'Submitting...';

            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage('Success', 'Your answers have been submitted successfully.');
                // Optionally disable further editing
                this.task1Answer.readOnly = true;
                this.task2Answer.readOnly = true;
                this.submitTest.disabled = true;
                
                // Stop timer
                if (this.timerInterval) {
                    clearInterval(this.timerInterval);
                    this.timerInterval = null;
                }
            } else {
                throw new Error(result.error || 'Submission failed');
            }
        } catch (error) {
            console.error('Submission error:', error);
            this.showMessage('Error', `Failed to submit answers: ${error.message}. Please try again.`);
        } finally {
            this.submitTest.disabled = false;
            this.submitTest.textContent = 'Submit Test';
        }
    }

    showMessage(title, text) {
        this.messageTitle.textContent = title;
        this.messageText.textContent = text;
        this.messageModal.style.display = 'block';
    }

    hideMessageModal() {
        this.messageModal.style.display = 'none';
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new IELTSTest();
});
