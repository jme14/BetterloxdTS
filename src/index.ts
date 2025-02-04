import { DiaryEntry } from "../types/letterboxd";
declare var Papa: any
class LetterboxdData {
    diary: DiaryEntry[] = [];
    private constructor() {}

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
   
        const diaryEntries: DiaryEntry[] = [];
        // Parse the CSV string using PapaParse
        Papa.parse(csvString, {
            header: true, // Use the first row as column names
            skipEmptyLines: true, // Skip empty lines
            dynamicTyping: true, // Automatically convert types (e.g., "true" becomes a boolean)
            complete: function (result: Papa.ParseResult<string>) {
                // Process each row
                result.data.forEach((row: any) => {
                    const entry: DiaryEntry = {
                        date: row["Date"],
                        name: row["Name"],
                        year: row["Year"],
                        uri: row["Letterboxd URI"],
                        rating: row["Rating"],
                        rewatch: row["Rewatch"], // PapaParse automatically converts true/false string to boolean
                        tags: row["Tags"],
                        watchedDate: row["Watched Date"],
                    };
                    diaryEntries.push(entry);
                });
            },
        });

        return diaryEntries;
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
        const listContent: string = Papa.unparse(this.diary, {
            header: true,
            columns: ["uri", "name"],
        });
        return listContent;
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
