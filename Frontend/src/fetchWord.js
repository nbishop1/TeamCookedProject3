export default async function fetchWord() {
    const res = await fetch("http://localhost:3001/getWord");
    const data = await res.json();

    const randomWord =
      data.phrases[Math.floor(Math.random() * data.phrases.length)];

    console.log("Random word:", randomWord);
    return randomWord;
}
