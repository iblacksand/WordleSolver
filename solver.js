"use strict";
class Solver {
    constructor() {
        this.wordlist = [];
        fetch('https://raw.githubusercontent.com/iblacksand/WordleSolver/main/words.txt') // update url to known repository.
            .then(response => response.text())
            .then(text => this.wordlist = text.split('\n'))
            .then(() => { let dh = new DOMHandler(this); }); // fetch wordlist from github
    }
    /**
     * @param {string} g - word guess
     * @param {string} code - code corresponding to guess (0 = not in word, 1 = in word but not in correct position, 2 = in word and in correct position)
     * @returns {string} - the top 5 guesses in order of likelihood
     */
    newGuess(g, code) {
        // Eliminate wrong words from wordlist
        g = g.toLowerCase();
        let newWordlist = [];
        for (let i = 0; i < this.wordlist.length; i++) {
            if (this.getCode(this.wordlist[i], g) == code)
                newWordlist.push(this.wordlist[i]);
        }
        this.wordlist = newWordlist; // replace wordlist with new wordlist
        // Find most likely words
        let scores = this.getScores(this.wordlist);
        let sorted = this.wordlist.slice().sort((a, b) => (scores[this.wordlist.indexOf(b)] - scores[this.wordlist.indexOf(a)]));
        let lg = "Most Likely Guesses:<br>" + sorted.slice(0, 5).join("<br>") + "<br><br>Number of possible words: " + this.wordlist.length;
        if (this.wordlist.length == 0)
            return `<article class="message is-large is-danger">
    <div class="message-body" style="font-family:font-family: 'Lustria'">
      No guesses found!<br>
      Page will reload in <strong>5 seconds</strong>.
    </div>
  </article>`;
        return lg;
    }
    getScores(wl) {
        let graph = new Array(4).fill(0).map(() => new Array(26).fill(0).map(() => new Array(26).fill(0)));
        let scores = [];
        wl.forEach(w => {
            for (let i = 0; i < w.length - 1; i++) {
                graph[i][w.charCodeAt(i) - 97][w.charCodeAt(i + 1) - 97] += 1;
            }
        });
        wl.forEach(w => {
            let score = 0;
            for (let i = 0; i < w.length - 1; i++) {
                score += graph[i][w.charCodeAt(i) - 97][w.charCodeAt(i + 1) - 97];
            }
            scores.push(score);
        });
        return scores;
    }
    getCode(w, g) {
        var _a, _b;
        let code = Array(5).fill("");
        let correct = "";
        for (let i = 0; i < g.length; i++) {
            if (w[i] == g[i]) { // letter in right position
                code[i] = "2";
                correct += g[i];
            }
        }
        for (let i = 0; i < g.length; i++) {
            if (w[i] == g[i])
                continue;
            if (w.includes(g[i])) {
                let in_word = w.match(new RegExp(g[i], "g")).length;
                let in_guess = g.match(new RegExp(g[i], "g")).length;
                let in_correct = (_b = (_a = correct.match(new RegExp(g[i], "g"))) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
                if ((in_correct + in_guess) <= in_word)
                    code[i] = "1"; // letter in wrong position but still in word. Checks to verify that there are not more letters in guess than word
                else
                    code[i] = "0";
            }
            else {
                code[i] = "0";
            }
        }
        return code.join("");
    }
}
class DOMHandler {
    constructor(s) {
        document.getElementById("solverfield").style.display = 'block';
        this.locked = false;
        this.code = [0, 0, 0, 0, 0];
        this.s = s;
        this.mb = document.getElementById("mb");
        this.instructions = document.getElementById("ins");
        this.ug = [];
        for (let i = 0; i < 5; i++) {
            this.ug.push(document.getElementById("char" + (i + 1))); // get text inputs
        }
        this.setCharListeners();
        this.ug.forEach(e => {
            e.style.caretColor = "transparent";
        });
        this.mb.onclick = this.findCode.bind(this);
        this.mb.addEventListener("keydown", (e) => {
            if (e.key == "Backspace")
                this.ug[4].focus();
        });
    }
    findCode() {
        this.ug.forEach((e) => {
            e.readOnly = true;
            e.style.cursor = "pointer";
            e.style.color = "#D7DADC";
            e.style.backgroundColor = "#3A3A3C";
            e.classList.add("us");
        });
        this.locked = true;
        this.ls = [];
        for (let i = 0; i < 5; i++) {
            this.ug[i].onclick = (() => {
                this.ug[i].selectionStart = this.ug[i].selectionEnd;
                this.code[i] = (this.code[i] + 1) % 3;
                if (this.code[i] == 0) {
                    this.ug[i].style.backgroundColor = "#3A3A3C";
                }
                else if (this.code[i] == 2) {
                    this.ug[i].style.backgroundColor = "#538D4E";
                }
                else {
                    this.ug[i].style.backgroundColor = "#B59F33";
                }
            });
        }
        this.instructions.textContent = "Click on each letter to change the color.";
        this.mb.onclick = this.getGuesses.bind(this);
    }
    getGuesses() {
        let g = "";
        this.ug.forEach((e) => { g += e.value.toLowerCase(); });
        let code = this.code.join("");
        let guesses = this.s.newGuess(g, code);
        document.getElementById("guesses").innerHTML = guesses;
        if (guesses.includes("guesses"))
            setTimeout(() => { location.reload(); }, 5000);
        this.mb.onclick = this.findCode.bind(this);
        this.locked = false;
        for (let i = 0; i < 5; i++) {
            let e = this.ug[i];
            e.readOnly = false;
            e.style.cursor = "text";
            e.style.color = "#363636";
            e.style.backgroundColor = "white";
            e.classList.remove("us");
            e.value = "";
            e.onclick = null;
        }
        ;
        this.ug[0].focus();
        this.code = [0, 0, 0, 0, 0];
        this.instructions.textContent = "Input your next guess.";
    }
    setCharListeners() {
        for (let i = 0; i < 5; i++) {
            this.ug[i].addEventListener("keydown", (e) => {
                if (this.locked) {
                    e.preventDefault();
                    return;
                }
                ;
                let k = e.key.toLowerCase();
                if (k == "backspace") {
                    this.ug[i].value = "";
                    if (i != 0)
                        this.ug[i - 1].focus();
                }
                else if (k.length == 1 && k >= 'a' && k <= 'z') {
                    this.ug[i].value = k.toUpperCase();
                    if (i != 4)
                        this.ug[i + 1].focus();
                    if (i == 4)
                        this.mb.focus();
                }
                ;
                e.preventDefault();
            }); // add event listeners to text inputs
        }
    }
}
let s = new Solver();
