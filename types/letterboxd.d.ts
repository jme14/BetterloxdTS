// diary_entry
// rating_entry

export interface DiaryEntry {
    date: string; // The date the entry was recorded
    name: string; // Movie title
    year: number; // Release year
    uri: string; // Letterboxd URL
    rating?: number; // Optional rating
    rewatch?: boolean; // Optional rewatch flag
    tags?: string[]; // Optional list of tags
    watchedDate: string; // The date the movie was watched
}
