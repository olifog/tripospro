from pinecone import Pinecone
import os
import dotenv
from openai import AsyncOpenAI
from prisma import Prisma, Base64
import sys
import requests

from io import BytesIO
from pypdf import PdfReader

import json
import asyncio

dotenv.load_dotenv()

client = AsyncOpenAI()

# DONE = {'DigElec', 'LogicProof', 'SWDesign', 'CompConstr', 'Semantics', 'DiscMathII', 'FoundsCS', 'AlgorithI', 'RLFA', 'DiscMathI', 'OpSystems', 'OOProg', 'Prolog', 'AlgorithII', 'FPComp', 'ConcDisSys', 'CandC++', 'MathMforCS', 'SWEng', 'CompDesign', 'Probabilty',
        # 'InfoTheory', 'Done', 'DiscMath', 'InfoRtrv', 'ConceptsPL', 'ArtIntII', 'Upserting', 'QuantComp', 'Types', 'Databases', 'CompGraph', 'CompVision', 'TopConc', 'NLP', 'ECommerce', 'CompArch', 'SWSecEng', 'OptComp', 'MobSensSys', 'TopIssues', 'HoareLogic', 'CompSysMod', 'AdvAlgo', 'Question', 'CompNet', 'MLBayInfer', 'ProgC', 'DSP', 'ArtIntI', 'PrincComm', 'TempLogic', 'SWIDesign', 'HCI', 'Graphics', 'Business', 'EconLaw', 'CompTheory', 'SysOnChip', 'MLRD', 'Algorithms', 'IntDesign', 'AdvGraph', 'HLog+ModC', 'ArtInt', 'DenotSem', 'Bioinfo', 'SecurityII', 'ProgJava', 'NumMethods', 'SecurityI'}

DONE = {}
DB_URL = os.getenv("DATABASE_URL")
PINECONE_HOST = os.getenv("PINECONE_HOST")

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(host=PINECONE_HOST)

async def get_question_text(question_url: str) -> str:
    response = requests.get(question_url)
    response.raise_for_status()

    pdf_file = BytesIO(response.content)
    reader = PdfReader(pdf_file)

    text = ""
    for page in reader.pages:
        try:
            text += page.extract_text()
        except Exception as e:
            print("Error extracting text from page", e)
    
    SYSTEM_PROMPT = """
    You are a parsed PDF text cleaner. The user will provide you with a string of text that is the contents of a PDF file.
    This pdf file is a question from a Cambridge University Computer Science Tripos paper, and may contain various
    mathematical formulae and other special characters.

    Your job is to clean up the text so that it can be used to create a vector database. The formatting should
    be as minimal as possible, while keeping all the information. Any specific mathematical formulae should be
    converted to inline LaTeX.
    """

    # get gpt-4o-mini to clean up the text
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
    )

    return response.choices[0].message.content

async def process_year(db, course_obj, year, year_data):
    course_year_obj = await db.courseyear.find_first(
        where={"courseId": course_obj.id, "year": year},
        include={"Question": True}
    )

    if not course_year_obj:
        print("Course year not found", course_obj.code, year)
        return []

    print(course_obj.code, year)

    tasks = [
        process_question(db, course_obj, course_year_obj, question_number, question_data)
        for question_number, question_data in year_data.items()
    ]

    course_vectors = await asyncio.gather(*tasks)
    return [vector for vector in course_vectors if vector is not None]

async def process_question(db, course_obj, course_year_obj, question_number, question_data):
    question_obj = None
    for question in course_year_obj.Question:
        if question.questionNumber == int(question_number):
            question_obj = question
            break

    if question_obj is None:
        print("Question not found", course_obj.code, course_year_obj.year, question_number)
        return None
    
    question_url = question_data["question_url"]
    question_text = await get_question_text("https://www.cl.cam.ac.uk/teaching/exams/pastpapers/" + question_url)

    question_embedding = (await client.embeddings.create(
        model="text-embedding-3-small",
        input=question_text,
    )).data[0].embedding

    metadata = {
        "text": question_text,
        "course": course_obj.name,
        "year": course_year_obj.year,
        "question_number": question_number,
        "paper": question_data["paper"],
        "triposPart": course_obj.triposPart.name,
    }

    if question_data.get("solution_url") is not None:
        metadata["solution_url"] = question_data["solution_url"]

    return {
        "id": str(question_obj.id),
        "values": question_embedding,
        "metadata": metadata,
    }

async def main():
    questions = json.load(open("./data/questions.json"))

    db = Prisma(auto_register=True)
    await db.connect()

    for course, course_data in questions.items():
        if course in DONE:
            print("Skipping", course)
            continue

        course_obj = await db.course.find_first(
            where={"code": course},
            include={"triposPart": True}
        )

        if not course_obj:
            continue

        tasks = [
            process_year(db, course_obj, year, year_data)
            for year, year_data in course_data.items()
        ]

        all_course_vectors = await asyncio.gather(*tasks)
        all_course_vectors = [vector for vectors in all_course_vectors for vector in vectors]

        print("Upserting", len(all_course_vectors), "vectors")
        try:
            index.upsert(
                vectors=all_course_vectors,
                namespace="questions",
            )
        except Exception as e:
            print("Error upserting vectors", e)
        print("Done")

if __name__ == "__main__":
    asyncio.run(main())
