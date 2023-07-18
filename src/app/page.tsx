import { Word } from "@prisma/client";

const getWords = async (dictId: number, page = 1, size = 20) => {
  const res = await fetch(
    `http://localhost:3000/api/words?dictId=${dictId}&page=${page}&size=${size}`
  );
  const data = await res.json();
  return { ok: true, words: data.data };
};

export default async function Home() {
  const { ok, words } = await getWords(1, 1, 5);
  if (!ok) return <div>get words error!</div>;

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      {words.map((word: Word) => (
        <p key={word.id} className="flex gap-4">
          {word.name}
          {word.trans}
          {word.ukphone}
          {word.usphone}
          {word.notation}
        </p>
      ))}
    </main>
  );
}
