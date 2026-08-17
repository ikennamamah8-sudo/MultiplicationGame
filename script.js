// Module entry for Math Blast app
const state = {
	soundEnabled: true,
	autoAdvanceTimeout: null,
	isAnswered: false,
	tableMode: 'all',
	opMode: 'add',
	num1: 7,
	num2: 8,
	correctAnswer: 15,
	correctCount: 0,
	incorrectCount: 0,
	streak: 0,
	answerHistory: []
};

let audioCtx = null;

function initAudio() {
	if (!audioCtx) {
		audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	}
	if (audioCtx.state === 'suspended') {
		audioCtx.resume();
	}
}

function playTone(freq, type, duration) {
	if (!state.soundEnabled) return;
	try {
		initAudio();
		const osc = audioCtx.createOscillator();
		const gain = audioCtx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
		gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
		osc.connect(gain);
		gain.connect(audioCtx.destination);
		osc.start();
		osc.stop(audioCtx.currentTime + duration);
	} catch (e) {
		console.error('Audio error:', e);
	}
}

function playSoundCorrect() {
	if (!state.soundEnabled) return;
	initAudio();
	playTone(659.25, 'sine', 0.15);
	setTimeout(() => playTone(880.0, 'sine', 0.3), 120);
}

function playSoundWrong() {
	if (!state.soundEnabled) return;
	initAudio();
	playTone(180, 'sawtooth', 0.35);
}

function toggleSound() {
	state.soundEnabled = !state.soundEnabled;
	const btnIcon = document.getElementById('sound-icon');
	const btn = document.getElementById('sound-btn');

	if (state.soundEnabled) {
		btnIcon.className = 'fa-solid fa-volume-high';
		btn.classList.replace('text-slate-400', 'text-indigo-700');
		playTone(523.25, 'sine', 0.1);
	} else {
		btnIcon.className = 'fa-solid fa-volume-xmark';
		btn.classList.add('text-slate-400');
	}
}

function getOperatorSymbol(opMode) {
	switch (opMode) {
		case 'add': return '+';
		case 'subtract': return '−';
		case 'multiply': return '×';
		case 'divide': return '÷';
		default: return '×';
	}
}

function calculateAnswer(num1, num2, opMode) {
	switch (opMode) {
		case 'add':
			return num1 + num2;
		case 'subtract':
			return num1 - num2;
		case 'multiply':
			return num1 * num2;
		case 'divide':
			return parseFloat((num1 / num2).toFixed(2));
		default:
			return num1 * num2;
	}
}

function generateQuestion() {
	if (state.autoAdvanceTimeout) {
		clearTimeout(state.autoAdvanceTimeout);
		state.autoAdvanceTimeout = null;
	}

	state.isAnswered = false;

	if (state.tableMode === 'all') {
		state.num1 = Math.floor(Math.random() * 12) + 1;
		state.num2 = Math.floor(Math.random() * 12) + 1;
	} else if (state.tableMode === 'easy') {
		state.num1 = Math.floor(Math.random() * 5) + 1;
		state.num2 = Math.floor(Math.random() * 10) + 1;
	} else {
		state.num1 = parseInt(state.tableMode, 10);
		state.num2 = Math.floor(Math.random() * 12) + 1;
	}

	if (Math.random() > 0.5 && state.tableMode === 'all') {
		const temp = state.num1;
		state.num1 = state.num2;
		state.num2 = temp;
	}

	state.correctAnswer = calculateAnswer(state.num1, state.num2, state.opMode);

	document.getElementById('num1').textContent = state.num1;
	document.getElementById('num2').textContent = state.num2;
	document.getElementById('operator-symbol').textContent = getOperatorSymbol(state.opMode);
	document.getElementById('answer-input').value = '';
	document.getElementById('answer-input').disabled = false;
	document.getElementById('answer-input').focus();

	const feedback = document.getElementById('feedback-banner');
	feedback.className = 'hidden my-4 p-4 rounded-2xl text-center font-extrabold text-xl sm:text-2xl border-4 transition-all animate-pop';

	document.getElementById('submit-btn').classList.remove('hidden');
	document.getElementById('next-btn').classList.add('hidden');
}

function checkAnswer() {
	if (state.isAnswered) {
		nextQuestion();
		return;
	}

	const input = document.getElementById('answer-input');
	const userVal = input.value.trim();

	if (userVal === '' || isNaN(userVal)) {
		input.classList.add('ring-4', 'ring-rose-500');
		setTimeout(() => input.classList.remove('ring-4', 'ring-rose-500'), 500);
		return;
	}

	const userAnswer = parseFloat(userVal);
	const feedback = document.getElementById('feedback-banner');
	const feedbackMsg = document.getElementById('feedback-message');

	state.isAnswered = true;
	input.disabled = true;
	document.getElementById('submit-btn').classList.add('hidden');
	document.getElementById('next-btn').classList.remove('hidden');

	const isCorrect = Math.abs(userAnswer - state.correctAnswer) < 0.001;
	const operatorSymbol = getOperatorSymbol(state.opMode);

	state.answerHistory.unshift({
		question: `${state.num1} ${operatorSymbol} ${state.num2}`,
		userAnswer,
		correctAnswer: state.correctAnswer,
		isCorrect,
		operator: state.opMode
	});

	if (state.answerHistory.length > 6) {
		state.answerHistory.pop();
	}

	if (isCorrect) {
		state.correctCount++;
		state.streak++;
		playSoundCorrect();

		feedback.classList.remove('hidden');
		feedback.classList.add('bg-emerald-100', 'text-emerald-900', 'border-emerald-400');
		feedbackMsg.innerHTML = `<i class="fa-solid fa-circle-check text-emerald-600 mr-2"></i> AWESOME! ${state.num1} ${operatorSymbol} ${state.num2} = ${state.correctAnswer} 🎉`;

		if (typeof confetti === 'function') {
			confetti({
				particleCount: state.streak % 5 === 0 ? 80 : 35,
				spread: 60,
				origin: { y: 0.7 }
			});
		}

		state.autoAdvanceTimeout = setTimeout(() => {
			if (state.isAnswered) nextQuestion();
		}, 1500);
	} else {
		state.incorrectCount++;
		state.streak = 0;
		playSoundWrong();

		feedback.classList.remove('hidden');
		feedback.classList.add('bg-rose-100', 'text-rose-900', 'border-rose-400');
		feedbackMsg.innerHTML = `<i class="fa-solid fa-circle-xmark text-rose-600 mr-2"></i> OOPS! ${state.num1} ${operatorSymbol} ${state.num2} = <span class="underline underline-offset-4 text-rose-700">${state.correctAnswer}</span>`;
		document.getElementById('next-btn').focus();
	}

	updateScoreboardUI();
	renderHistory();
}

function nextQuestion() {
	if (state.autoAdvanceTimeout) {
		clearTimeout(state.autoAdvanceTimeout);
		state.autoAdvanceTimeout = null;
	}
	generateQuestion();
}

function updateScoreboardUI() {
	document.getElementById('score-correct').textContent = state.correctCount;
	document.getElementById('score-incorrect').textContent = state.incorrectCount;
	document.getElementById('score-streak').textContent = state.streak;
}

function renderHistory() {
	const historyEl = document.getElementById('answer-history');
	const countEl = document.getElementById('history-count');

	if (!state.answerHistory.length) {
		historyEl.innerHTML = '<li class="text-slate-500">Answer history will appear here after your first attempt.</li>';
		countEl.textContent = '0 past answers';
		return;
	}

	countEl.textContent = `${state.answerHistory.length} past answer${state.answerHistory.length === 1 ? '' : 's'}`;
	historyEl.innerHTML = state.answerHistory.map((entry) => {
		const statusClass = entry.isCorrect ? 'text-emerald-700' : 'text-rose-700';
		const symbol = entry.isCorrect ? '✅' : '❌';
		return `
			<li class="rounded-2xl p-3 bg-white shadow-sm border ${entry.isCorrect ? 'border-emerald-100' : 'border-rose-100'}">
				<div class="flex items-center justify-between gap-3">
					<span class="font-semibold ${statusClass}">${symbol} ${entry.question}</span>
					<span class="text-xs text-slate-400">${entry.operator}</span>
				</div>
				<div class="text-slate-600 text-sm mt-1">Your answer: <span class="font-bold">${entry.userAnswer}</span> • Correct: <span class="font-bold">${entry.correctAnswer}</span></div>
			</li>
		`;
	}).join('');
}

function resetScores() {
	state.correctCount = 0;
	state.incorrectCount = 0;
	state.streak = 0;
	updateScoreboardUI();
	generateQuestion();
}

function changeTableMode(mode) {
	state.tableMode = mode;
	generateQuestion();
}

function changeOperator(opMode) {
	state.opMode = opMode;
	document.querySelectorAll('label[for^="radio-op-"]').forEach((label) => {
		label.classList.remove('bg-blue-700', 'text-white', 'ring-2', 'ring-blue-300');
		label.classList.add('bg-blue-600', 'text-white/90');
	});
	const activeLabel = document.querySelector(`label[for="radio-op-${opMode}"]`);
	if (activeLabel) {
		activeLabel.classList.remove('bg-blue-600', 'text-white/90');
		activeLabel.classList.add('bg-blue-700', 'text-white', 'ring-2', 'ring-blue-300');
	}
	const activeInput = document.getElementById(`radio-op-${opMode}`);
	if (activeInput) {
		activeInput.checked = true;
	}
	generateQuestion();
}

function pressKey(key) {
	if (state.isAnswered) return;

	const input = document.getElementById('answer-input');
	initAudio();

	if (key === 'clear') {
		input.value = '';
	} else if (key === 'backspace') {
		input.value = input.value.slice(0, -1);
	} else {
		if (input.value.length < 6) {
			input.value += key;
		}
	}
	playTone(400, 'sine', 0.05);
	input.focus();
}

document.addEventListener('keydown', (e) => {
	if (!state.isAnswered && /^[0-9]$/.test(e.key)) {
		const input = document.getElementById('answer-input');
		if (document.activeElement !== input && input.value.length < 6) {
			input.value += e.key;
		}
	} else if (e.key === 'Backspace' && document.activeElement !== document.getElementById('answer-input')) {
		pressKey('backspace');
	} else if (e.key === 'Enter') {
		e.preventDefault();
		if (state.isAnswered) {
			nextQuestion();
		} else {
			checkAnswer();
		}
	}
});

// Expose functions for inline onclick handlers
window.toggleSound = toggleSound;
window.checkAnswer = checkAnswer;
window.nextQuestion = nextQuestion;
window.pressKey = pressKey;
window.resetScores = resetScores;
window.changeTableMode = changeTableMode;
window.changeOperator = changeOperator;

// Initialize UI on load
window.addEventListener('DOMContentLoaded', () => {
	changeOperator(state.opMode);
	renderHistory();
	updateScoreboardUI();
});

export { state };
