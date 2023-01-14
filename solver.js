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
     * @param {string} code - code corresponding to guess (0 = not in word, 1 = in word and in correct position, 2 = in word but not in correct position)
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
        let oc = new Map(); // map of letter to number of occurrences
        const loc = new Array(5).fill(0).map(() => new Array(26).fill(0));
        this.wordlist.forEach(w => {
            for (let i = 0; i < w.length; i++) {
                if (oc.has(w[i]))
                    oc.set(w[i], oc.get(w[i]) + 1);
                loc[i][w.charCodeAt(i) - 97] += 1;
            }
        });
        let scores = [];
        this.wordlist.forEach(w => {
            let score = 0;
            for (let i = 0; i < w.length; i++) {
                score += .25 * oc.get(w[i]) + .75 * loc[i][w.charCodeAt(i) - 97];
            }
            scores.push(score);
        });
        let sorted = this.wordlist.slice().sort((a, b) => (scores[this.wordlist.indexOf(b)] - scores[this.wordlist.indexOf(a)]));
        let lg = "Most Likely Guesses:<br>" + sorted.slice(0, 5).join("<br>");
        if (this.wordlist.length == 0)
            return "No guesses found.<br>Page will refresh in 5 seconds.";
        return lg;
    }
    getCode(w, g) {
        let code = "";
        for (let i = 0; i < g.length; i++) {
            if (w.includes(g[i])) {
                if (w[i] == g[i]) { // letter in right position
                    code += "1";
                }
                else {
                    if (w.match(new RegExp(g[i], "g")).length >= g.substring(0, i + 1).match(new RegExp(g[i], "g")).length)
                        code += "2"; // letter in wrong position but still in word. Checks to verify that there are not more letters in guess than word
                    else
                        code += "0";
                }
            }
            else {
                code += "0";
            }
        }
        return code;
    }
}
class DOMHandler {
    constructor(s) {
        document.getElementById("solverfield").style.display = 'block';
        this.code = [0, 0, 0, 0, 0];
        this.s = s;
        this.mb = document.getElementById("mb");
        this.instructions = document.getElementById("ins");
        this.uguesses = [];
        for (let i = 0; i < 5; i++) {
            this.uguesses.push(document.getElementById("char" + (i + 1))); // get text inputs
        }
        this.setCharListeners();
        this.uguesses.forEach(e => {
            e.style.caretColor = "transparent";
        });
        this.mb.onclick = this.findCode.bind(this);
    }
    findCode() {
        this.uguesses.forEach((e) => {
            e.readOnly = true;
            e.style.cursor = "pointer";
            e.style.color = "#D7DADC";
            e.style.backgroundColor = "#3A3A3C";
            e.classList.add("us");
        });
        this.ls = [];
        for (let i = 0; i < 5; i++) {
            this.uguesses[i].onclick = (() => {
                this.uguesses[i].selectionStart = this.uguesses[i].selectionEnd;
                this.code[i] = (this.code[i] + 1) % 3;
                if (this.code[i] == 0) {
                    this.uguesses[i].style.backgroundColor = "#3A3A3C";
                }
                else if (this.code[i] == 1) {
                    this.uguesses[i].style.backgroundColor = "#538D4E";
                }
                else {
                    this.uguesses[i].style.backgroundColor = "#B59F33";
                }
            });
        }
        this.instructions.textContent = "Click on each letter to change the color.";
        this.mb.onclick = this.getGuesses.bind(this);
    }
    getGuesses() {
        let g = "";
        this.uguesses.forEach((e) => { g += e.value; });
        let code = this.code.join("");
        let guesses = this.s.newGuess(g, code);
        document.getElementById("guesses").innerHTML = guesses;
        if (guesses.includes("guesses"))
            setTimeout(() => { location.reload(); }, 5000);
        this.mb.onclick = this.findCode.bind(this);
        for (let i = 0; i < 5; i++) {
            let e = this.uguesses[i];
            e.readOnly = false;
            e.style.cursor = "text";
            e.style.color = "#363636";
            e.style.backgroundColor = "white";
            e.classList.remove("us");
            e.value = "";
            e.onclick = null;
        }
        ;
        this.uguesses[0].focus();
        this.code = [0, 0, 0, 0, 0];
        this.instructions.textContent = "Input your next guess.";
    }
    setCharListeners() {
        for (let i = 0; i < 5; i++) {
            this.uguesses[i].addEventListener("keydown", (e) => {
                let k = e.key.toLowerCase();
                if (k == "backspace") {
                    this.uguesses[i].value = "";
                    if (i != 0)
                        this.uguesses[i - 1].focus();
                }
                else if (k.length == 1 && k >= 'a' && k <= 'z') {
                    this.uguesses[i].value = k;
                    if (i != 4)
                        this.uguesses[i + 1].focus();
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
