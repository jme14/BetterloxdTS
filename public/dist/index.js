"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const csv_parse_1 = require("csv-parse");
const sync_1 = require("csv-stringify/sync");
class LetterboxdData {
    constructor() {
        this.diary = [];
    }
    static init() {
        return __awaiter(this, void 0, void 0, function* () {
            const instance = new LetterboxdData();
            instance.diary = yield instance.readDiaryFromDataFolder();
            return instance;
        });
    }
    static initFromDiaryArray(diaryEntryArray) {
        const instance = new LetterboxdData();
        instance.diary = diaryEntryArray;
        return instance;
    }
    static initFromString(csvString) {
        return __awaiter(this, void 0, void 0, function* () {
            const instance = new LetterboxdData();
            instance.diary = yield instance.readDiary(csvString);
            return instance;
        });
    }
    readDiary(csvString) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            const parser = (0, csv_parse_1.parse)(csvString, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            });
            const diaryEntries = [];
            try {
                for (var _d = true, parser_1 = __asyncValues(parser), parser_1_1; parser_1_1 = yield parser_1.next(), _a = parser_1_1.done, !_a; _d = true) {
                    _c = parser_1_1.value;
                    _d = false;
                    const row = _c;
                    const entry = {
                        date: row["Date"],
                        name: row["Name"],
                        year: Number(row["Year"]),
                        uri: row["Letterboxd URI"],
                        rating: Number(row["Rating"]),
                        rewatch: Boolean(row["Rewatch"]),
                        tags: row["Tags"],
                        watchedDate: row["Watched Date"],
                    };
                    diaryEntries.push(entry);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = parser_1.return)) yield _b.call(parser_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return diaryEntries;
        });
    }
    readDiaryFromDataFolder() {
        return __awaiter(this, void 0, void 0, function* () {
            const filePath = "data/diary.csv";
            const fileString = fs_1.default.readFileSync(filePath, "utf-8");
            return this.readDiary(fileString);
        });
    }
    filterByWatchedDate(yearFilter, monthFilter, dayFilter) {
        return __awaiter(this, void 0, void 0, function* () {
            const diary = this.diary;
            const filteredDiary = diary.filter((entry) => {
                const watchedDate = new Date(`${entry.watchedDate}T00:00:00Z`);
                const watchedYear = watchedDate.getUTCFullYear();
                return watchedYear == yearFilter;
            });
            const filteredLetterboxdData = LetterboxdData.initFromDiaryArray(filteredDiary);
            return filteredLetterboxdData;
        });
    }
    filterByRewatch(rewatch) {
        return __awaiter(this, void 0, void 0, function* () {
            const diary = this.diary;
            const filteredDiary = diary.filter((entry) => {
                return entry.rewatch == rewatch;
            });
            const filteredLetterboxdData = LetterboxdData.initFromDiaryArray(filteredDiary);
            return filteredLetterboxdData;
        });
    }
    getDiaryAsLetterboxdListString() {
        const listContent = (0, sync_1.stringify)(this.diary, {
            header: true,
            columns: [
                { key: "uri", header: "Letterboxd URI" },
                { key: "name", header: "Title" },
            ],
        });
        return listContent;
    }
    writeDiaryAsLetterboxdList(listName) {
        return __awaiter(this, void 0, void 0, function* () {
            const listContent = this.getDiaryAsLetterboxdListString();
            fs_1.default.writeFileSync(`out/${listName}.csv`, listContent);
        });
    }
    sortDiaryByRating(descending) {
        var returner = 1;
        if (descending) {
            returner = -1;
        }
        this.diary = this.diary.sort((a, b) => {
            if (a.rating == undefined) {
                return returner;
            }
            else if (b.rating == undefined) {
                return -returner;
            }
            if (a.rating >= b.rating) {
                return returner;
            }
            else {
                return -returner;
            }
        });
    }
}
function getLetterboxdDataForYearFirstWatches(lbData) {
    return __awaiter(this, void 0, void 0, function* () {
        // const lbData = await LetterboxdData.init();
        // console.log(lbData.diary)
        const filteredByDate = yield lbData.filterByWatchedDate(2024);
        const filteredLBData = yield filteredByDate.filterByRewatch(false);
        filteredLBData.sortDiaryByRating(true);
        //filteredLBData.writeDiaryAsLetterboxdList("2024 First Watches Ranked");
        return filteredLBData;
    });
}
// getLetterboxdData();
// Function to trigger a file download
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    // Create a temporary anchor element to trigger the download
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Release the object URL
    URL.revokeObjectURL(url);
}
// Get references to the DOM elements
const fileInput = document.getElementById("fileInput");
const processButton = document.getElementById("processButton");
const output = document.getElementById("output");
// Add an event listener to the button
processButton.addEventListener("click", () => {
    // Check if a file is selected
    if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        output.textContent = `Selected file: ${file.name}`;
        // Read the file content
        const reader = new FileReader();
        reader.onload = (event) => {
            var _a;
            const fileContent = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result;
            console.log("File content:", fileContent);
            const lbDataPromise = LetterboxdData.initFromString(fileContent);
            lbDataPromise.then((lbData) => __awaiter(void 0, void 0, void 0, function* () {
                const betterLBData = yield getLetterboxdDataForYearFirstWatches(lbData);
                const lbList = betterLBData.getDiaryAsLetterboxdListString();
                downloadFile(lbList, "Your List.csv", "text/csv");
            }));
        };
        reader.readAsText(file);
    }
    else {
        output.textContent = "No file selected.";
    }
});
//# sourceMappingURL=index.js.map