// Utility functions for time formatting

export function formatHoursToTime(hours: number): string {
    const totalMinutes = Math.round(hours * 60)
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60

    if (m === 0) {
        return `${h} Std.`
    }
    return `${h} Std. ${m} Min.`
}

export function formatMinutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60

    if (h === 0) {
        return `${m} Min.`
    }
    if (m === 0) {
        return `${h} Std.`
    }
    return `${h} Std. ${m} Min.`
}
