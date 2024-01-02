export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
        return 'Inget datum valt'; // Or handle invalid dates as per your application's needs
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-based
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
}