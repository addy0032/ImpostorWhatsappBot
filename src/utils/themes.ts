export const themes = [
    "Sports",
    "Entertainment",
    "People & Society",
    "Nature & Animals",
    "Lifestyle",
    "Knowledge",
    "Arts & Hobbies",
    "World & Places",
    "Football Players",
    "Movies",
    "Cartoon Characters",
    "Famous People",
    "Food & Drinks",
    "Brands",
    "Musical Instruments",
    "Countries & Cities",
    "Famous Landmarks",
    "Video Games",
    "Science",
    "Animals"
];

export const getRandomTheme = (): string => {
    const min = 0;
    const max = themes.length - 1;
    const randomIndex = Math.floor(Math.random() * (max - min + 1)) + min;
    return (themes[randomIndex] as string) || (themes[0] as string);
};
