export const extractNumericValue = (input: string) => {
    const numericValue = input.replace(/[^0-9]/g, '');
    return numericValue ? parseInt(numericValue) : null;
}
