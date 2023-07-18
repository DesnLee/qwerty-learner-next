import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { dictList } from "./dicts";
import * as fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  if (type === "dict") {
    // const { code, msg } = await syncDict();
    // return NextResponse.json({ msg }, { status: code });
    return NextResponse.json({ msg: "ok" });
  } else if (type === "words") {
    const name = request.nextUrl.searchParams.get("name");
    const dictId = request.nextUrl.searchParams.get("dictId");
    if (!name || !dictId)
      return NextResponse.json({ msg: "params error!" }, { status: 400 });

    const { code, msg } = await syncWords(name, Number(dictId));
    return NextResponse.json({ msg }, { status: code });
  } else {
    return NextResponse.json({ msg: "params error!" }, { status: 400 });
  }
}

const syncDict = async () => {
  try {
    for (const dict of dictList) {
      const { category, tags } = dict;

      // 数据库中分类的 ID
      let dbCategory = await prisma.category.findUnique({
        where: { name: category },
      });
      if (!dbCategory) {
        dbCategory = await prisma.category.create({ data: { name: category } });
      }

      // 数据库中 tags 的 ID
      const tagIds = [];
      for (const tag of tags) {
        let dbTag = await prisma.tag.findUnique({
          where: { name: tag },
        });
        if (!dbTag) {
          dbTag = await prisma.tag.create({ data: { name: tag } });
        }
        tagIds.push(dbTag.id);
      }

      const dbDict = await prisma.dict.create({
        data: {
          name: dict.name,
          description: dict.description,
          language: dict.language,
          languageCategory: dict.languageCategory,
          category: dbCategory.id,
        },
      });

      await prisma.tagDict.createMany({
        data: tagIds.map((tagId) => ({ tagId, dictId: dbDict.id })),
      });

      console.log(dict.name, " >>> done");
    }

    return { code: 200, msg: "ok" };
  } catch (e) {
    console.log(e);
    return { code: 500, msg: "sync error!" };
  }
};

const syncWords = async (name: string, dictId: number) => {
  try {
    const words = JSON.parse(
      fs.readFileSync(
        path.resolve(`src/app/api/sync/dictWords/${name}.json`),
        "utf-8"
      )
    );

    const dict = await prisma.dict.findUnique({ where: { id: dictId } });
    if (!dict) return { code: 404, msg: "dict not found!" };

    for (const word of words) {
      const dbWord = await prisma.word.create({
        data: {
          name: word.name,
          trans: word.trans,
          usphone: word.usphone ?? null,
          ukphone: word.ukphone ?? null,
          notation: word.notation ?? null,
        },
      });

      await prisma.wordDict.create({
        data: {
          wordId: dbWord.id,
          dictId: dictId,
        },
      });
    }

    return { code: 200, msg: "ok" };
  } catch (e) {
    console.log(e);
    return { code: 500, msg: "sync error!" };
  }
};
