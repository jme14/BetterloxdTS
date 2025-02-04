import fs from "fs";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify/sync";
import { DiaryEntry } from "../types/letterboxd";

class LetterboxdData {
    diary: DiaryEntry[] = [];
    private constructor() {}
    static async init(): Promise<LetterboxdData> {
        const instance: LetterboxdData = new LetterboxdData();
        instance.diary = await instance.readDiaryFromDataFolder();
        return instance;
    }

    static initFromDiaryArray(diaryEntryArray: DiaryEntry[]) {
        const instance = new LetterboxdData();
        instance.diary = diaryEntryArray;
        return instance;
    }

    static async initFromString(csvString: string): Promise<LetterboxdData> {
        const instance = new LetterboxdData();
        instance.diary = await instance.readDiary(csvString);
        return instance;
    }

    private async readDiary(csvString: string): Promise<DiaryEntry[]> {
        const parser = parse(csvString, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
        });
        const diaryEntries: DiaryEntry[] = [];
        for await (const row of parser) {
            const entry: DiaryEntry = {
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
        return diaryEntries;
    }
    private async readDiaryFromDataFolder(): Promise<DiaryEntry[]> {
        const filePath = "data/diary.csv";
        const fileString = fs.readFileSync(filePath, "utf-8");
        return this.readDiary(fileString);
    }

    async filterByWatchedDate(
        yearFilter: number,
        monthFilter?: number,
        dayFilter?: number
    ): Promise<LetterboxdData> {
        const diary: DiaryEntry[] = this.diary;
        const filteredDiary = diary.filter((entry) => {
            const watchedDate: Date = new Date(
                `${entry.watchedDate}T00:00:00Z`
            );
            const watchedYear = watchedDate.getUTCFullYear();
            return watchedYear == yearFilter;
        });
        const filteredLetterboxdData =
            LetterboxdData.initFromDiaryArray(filteredDiary);
        return filteredLetterboxdData;
    }
    async filterByRewatch(rewatch: boolean): Promise<LetterboxdData> {
        const diary: DiaryEntry[] = this.diary;
        const filteredDiary = diary.filter((entry) => {
            return entry.rewatch == rewatch;
        });
        const filteredLetterboxdData =
            LetterboxdData.initFromDiaryArray(filteredDiary);
        return filteredLetterboxdData;
    }

    getDiaryAsLetterboxdListString(): string {
        const listContent: string = stringify(this.diary, {
            header: true,
            columns: [
                { key: "uri", header: "Letterboxd URI" },
                { key: "name", header: "Title" },
            ],
        });
        return listContent;
    }
    async writeDiaryAsLetterboxdList(listName: string) {
        const listContent = this.getDiaryAsLetterboxdListString();
        fs.writeFileSync(`out/${listName}.csv`, listContent);
    }

    sortDiaryByRating(descending: boolean) {
        var returner = 1;
        if (descending) {
            returner = -1;
        }
        this.diary = this.diary.sort((a, b) => {
            if (a.rating == undefined) {
                return returner;
            } else if (b.rating == undefined) {
                return -returner;
            }

            if (a.rating >= b.rating) {
                return returner;
            } else {
                return -returner;
            }
        });
    }
}

async function getLetterboxdDataForYearFirstWatches(lbData: LetterboxdData) {
    // const lbData = await LetterboxdData.init();
    // console.log(lbData.diary)
    const filteredByDate = await lbData.filterByWatchedDate(2024);
    const filteredLBData = await filteredByDate.filterByRewatch(false);
    filteredLBData.sortDiaryByRating(true);

    //filteredLBData.writeDiaryAsLetterboxdList("2024 First Watches Ranked");
    return filteredLBData;
}

// getLetterboxdData();

// Function to trigger a file download
function downloadFile(content: string, filename: string, mimeType: string) {
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
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const processButton = document.getElementById(
    "processButton"
) as HTMLButtonElement;
const output = document.getElementById("output") as HTMLParagraphElement;

// Add an event listener to the button
processButton.addEventListener("click", () => {
    // Check if a file is selected
    if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        output.textContent = `Selected file: ${file.name}`;

        // Read the file content
        const reader = new FileReader();
        reader.onload = (event) => {
            const fileContent = event.target?.result as string;
            console.log("File content:", fileContent);

            const lbDataPromise = LetterboxdData.initFromString(fileContent);
            lbDataPromise.then(async (lbData) => {
                const betterLBData = await getLetterboxdDataForYearFirstWatches(
                    lbData
                );
                const lbList = betterLBData.getDiaryAsLetterboxdListString();
                downloadFile(lbList, "Your List.csv", "text/csv")
            });
        };
        reader.readAsText(file);
    } else {
        output.textContent = "No file selected.";
    }
});
