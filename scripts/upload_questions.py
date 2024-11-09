
from prisma import Prisma, Base64
import json
import asyncio
import os
from dotenv import load_dotenv
import zlib

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]

DONE = {'CompDesign', 'MobSensSys', 'SWEng', 'Databases', 'Types', 'ArtIntII', 'ArtIntI', 'SecurityI', 'HoareLogic', 'SysOnChip', 'PrincComm', 'SecurityII', 'FPComp', 'Complexity', 'LogicProof', 'DigElec', 'QuantComp', 'DenotSem', 'OptComp', 'CompConstr', 'Prolog', 'ECommerce', 'NLP', 'Probabilty', 'CandC++', 'CompVision', 'TempLogic', 'ConcDisSys', 'ConceptsPL', 'Semantics', 'OpSystems', 'InfoRtrv', 'DiscMathII', 'SWDesign', 'OOProg', 'TopIssues', 'MathMforCS', 'AlgorithI', 'CompSysMod', 'EconLaw', 'CompNet', 'AdvGraph', 'CompTheory', 'RLFA', 'DiscMathI', 'FoundsCS', 'CompGraph', 'DSP', 'Bioinfo', 'Business', 'CompFunds', 'AlgorithII', 'CompArch', 'HCI', 'Algorithms', 'DiscMath', 'SWIDesign',
        'TopConc', 'NumMethods', 'ProgJava', 'AdvAlgo', 'HLog+ModC', 'DatabasesA', 'Graphics', 'MLRD', 'IntDesign', 'SWSecEng'}

def academic_year_to_second_year(year):
    tmp = int(year[2:])
    if tmp < 90:
        return f"20{year[2:]}"
    else:
        return f"19{year[2:]}"

async def main():
    db = Prisma(auto_register=True)
    await db.connect()

    questions = json.load(open("./data/questions.json"))

    for course_code, course_years in questions.items():
        if course_code in DONE:
            print(f"Skipping {course_code} because it's already done")
            continue

        course = await db.course.find_first(
            where={"code": course_code},
            include={"triposPart": True}
        )

        if course is None:
            print(f"Course {course_code} not found")
            continue

        for year, questions in course_years.items():
            print(course_code, year)
            try:
                course_year = await db.courseyear.upsert(
                    where={"courseId_year": {"courseId": course.id, "year": year}},
                    data={
                        "create": {
                            "courseYearUrl": "",
                            "course": {"connect": {"id": course.id}},
                            "year": year,
                            "michaelmas": False,
                            "lent": False,
                            "easter": False,
                            "lectures": 0,
                            "suggestedSupervisions": 0,
                            "description": Base64.encode(zlib.compress("<p>This year of this course hasn't been added to the database yet! :)</p>".encode("utf-8")))
                        },
                        "update": {},
                    },
                )
            except Exception as e:
                print(e)

            for question_number, question_data in questions.items():
                # create the paper if it doesn't exist
                paper = await db.paper.upsert(
                    where={"name_triposPartId": {"name": question_data["paper"], "triposPartId": course.triposPart.id}},
                    data={
                        "create": {"name": question_data["paper"], "triposPartId": course.triposPart.id},
                        "update": {},
                    }
                )

                # create the paper year if it doesn't exist
                paper_year = await db.paperyear.upsert(
                    where={"paperId_year": {"paperId": paper.id, "year": year}},
                    data={
                        "create": {
                            "paperId": paper.id,
                            "year": year,
                            "paperYearUrl": f"https://www.cl.cam.ac.uk/teaching/exams/pastpapers/y{year}paper{paper.name}.html",
                        },
                        "update": {},
                    },
                )

                # create the question if it doesn't exist
                try:
                    await db.question.upsert(
                        where={"courseYearId_questionNumber": {"courseYearId": course_year.id, "questionNumber": int(question_number)}},
                        data={
                            "create": {
                                "courseYearId": course_year.id,
                                "questionNumber": int(question_number),
                                "questionUrl": question_data["question_url"],
                                "solutionUrl": question_data["solution_url"] if question_data["solution_url"] is not None else "",
                                "paperYearId": paper_year.id,
                            },
                            "update": {
                                "questionUrl": question_data["question_url"],
                                "solutionUrl": question_data["solution_url"] if question_data["solution_url"] is not None else "",
                            },
                        }
                    )
                except Exception as e:
                    print(e)


if __name__ == "__main__":
    asyncio.run(main())

