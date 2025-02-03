import fs from "fs";
import { parse } from "csv-parse";
import { DiaryEntry } from "../types/letterboxd";

class LetterboxdData {
    diary: DiaryEntry[] = [];
    private constructor() {}
    static async init(diaryEntryArray?: DiaryEntry[]): Promise<LetterboxdData> {

        if (diaryEntryArray){
            const instance = new LetterboxdData()
            instance.diary = diaryEntryArray
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
                watchedDate: row["Watched Date"]
            }
            diaryEntries.push(entry);
        }
        return diaryEntries;
    }

    async filterByWatchedDate(yearFilter: number, monthFilter?: number, dayFilter?: number): Promise<LetterboxdData>{
        const diary: DiaryEntry[] = this.diary
        const filteredDiary = diary.filter((entry) =>{
            const watchedDate: Date = new Date(`${entry.watchedDate}T00:00:00Z`)
            const watchedYear = watchedDate.getUTCFullYear()
            return watchedYear == yearFilter
        })
        const filteredLetterboxdData = await LetterboxdData.init(filteredDiary)
        return filteredLetterboxdData;
    }
}

async function getLetterboxdData(){
    const lbData = await LetterboxdData.init();
    // console.log(lbData.diary)
    const filteredLBData = await lbData.filterByWatchedDate(2024)
    console.log(filteredLBData.diary)
    console.log(filteredLBData.diary.length)


}

getLetterboxdData()
