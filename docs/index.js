var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class LetterboxdData {
    constructor() {
        this.diary = [];
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
            const diaryEntries = [];
            // Parse the CSV string using PapaParse
            Papa.parse(csvString, {
                header: true, // Use the first row as column names
                skipEmptyLines: true, // Skip empty lines
                dynamicTyping: true, // Automatically convert types (e.g., "true" becomes a boolean)
                complete: function (result) {
                    // Process each row
                    result.data.forEach((row) => {
                        const entry = {
                            date: row["Date"],
                            name: row["Name"],
                            year: row["Year"],
                            uri: row["Letterboxd URI"],
                            rating: row["Rating"],
                            rewatch: row["Rewatch"] || false, // PapaParse automatically converts true/false string to boolean
                            tags: row["Tags"],
                            watchedDate: row["Watched Date"],
                        };
                        diaryEntries.push(entry);
                    });
                },
            });
            return diaryEntries;
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
        const listContent = Papa.unparse(this.diary, {
            header: true,
        });
        return listContent;
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
document.addEventListener("DOMContentLoaded", () => {
    const listTypeInputs = document.querySelectorAll('input[name="listType"]');
    const yearInput = document.getElementById("yearInput");
    const nInput = document.getElementById("nInput");
    // Function to switch between yearInput and nInput dynamically
    function updateInputVisibility() {
        const selectedType = document.querySelector('input[name="listType"]:checked').value;
        if (selectedType === "yearEnd") {
            yearInput.style.display = "block"; // Change to flex for better styling
            nInput.style.display = "none";
        }
        else {
            yearInput.style.display = "none";
            nInput.style.display = "block";
        }
    }
    // Attach event listeners to radio buttons
    listTypeInputs.forEach((input) => {
        input.addEventListener("change", updateInputVisibility);
    });
    // Run the function once to ensure correct initial state
    updateInputVisibility();
});
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
            // console.log("File content:", fileContent);
            const lbDataPromise = LetterboxdData.initFromString(fileContent);
            lbDataPromise.then((lbData) => __awaiter(void 0, void 0, void 0, function* () {
                console.log(lbData);
                const betterLBData = yield getLetterboxdDataForYearFirstWatches(lbData);
                const lbList = betterLBData.getDiaryAsLetterboxdListString();
                console.log(lbList);
                downloadFile(lbList, "Your List.csv", "text/csv");
            }));
        };
        reader.readAsText(file);
    }
    else {
        output.textContent = "No file selected.";
    }
});
export {};
