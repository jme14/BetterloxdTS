import fs from "fs";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify/sync";
import { DiaryEntry } from "../types/letterboxd";

class LetterboxdData {
    diary: DiaryEntry[] = [];
    private constructor() {}
    static async init(diaryEntryArray?: DiaryEntry[]): Promise<LetterboxdData> {
        if (diaryEntryArray) {
            const instance = new LetterboxdData();
            instance.diary = diaryEntryArray;
            return instance;
        }

        const instance: LetterboxdData = new LetterboxdData();
        instance.diary = await instance.readDiary();
        return instance;
    }
    private async readDiary(): Promise<DiaryEntry[]> {
        const filePath = "data/diary.csv";
        const fileStream = fs.createReadStream(filePath);

        const parser = fileStream.pipe(
            parse({
                columns: true, // Convert rows into objects using headers
                skip_empty_lines: true,
                trim: true, // Remove spaces around values
            })
        );

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
        const filteredLetterboxdData = await LetterboxdData.init(filteredDiary);
        return filteredLetterboxdData;
    }
    async filterByRewatch(rewatch: boolean): Promise<LetterboxdData> {
        const diary: DiaryEntry[] = this.diary;
        const filteredDiary = diary.filter((entry) => {
            return entry.rewatch == rewatch;
        });
        const filteredLetterboxdData = await LetterboxdData.init(filteredDiary);
        return filteredLetterboxdData;
    }

    async writeDiaryAsLetterboxdList(listName: string) {
        const listContent: string = stringify(this.diary, {
            header: true,
            columns: [
                { key: "uri", header: "Letterboxd URI" },
                { key: "name", header: "Title" },
            ],
        });

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

async function getLetterboxdData() {
    const lbData = await LetterboxdData.init();
    // console.log(lbData.diary)
    const filteredByDate = await lbData.filterByWatchedDate(2024);
    const filteredLBData = await filteredByDate.filterByRewatch(false);
    filteredLBData.sortDiaryByRating(true);

    filteredLBData.writeDiaryAsLetterboxdList("2024 First Watches Ranked");
}

getLetterboxdData();
