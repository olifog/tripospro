import os
from dotenv import load_dotenv

import json
import asyncio
import zlib

from prisma import Prisma, Base64
from prisma.models import User, TriposPart

load_dotenv()

DB_URL = os.environ["DATABASE_URL"]
SOURCE_URLS = [
    "https://www.cl.cam.ac.uk/teaching/1112/part1a-cst.html",
    "https://www.cl.cam.ac.uk/teaching/1112/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/1112/part2.html",
    "https://www.cl.cam.ac.uk/teaching/1112/part3.html",
    "https://www.cl.cam.ac.uk/teaching/1213/part1a-cst.html",
    "https://www.cl.cam.ac.uk/teaching/1213/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/1213/part2.html",
    "https://www.cl.cam.ac.uk/teaching/1213/part3.html",
    "https://www.cl.cam.ac.uk/teaching/1314/part1a-cst.html",
    "https://www.cl.cam.ac.uk/teaching/1314/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/1314/part2.html",
    "https://www.cl.cam.ac.uk/teaching/1314/part3.html",
    "https://www.cl.cam.ac.uk/teaching/1415/part1a-cst.html",
    "https://www.cl.cam.ac.uk/teaching/1415/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/1415/part2.html",
    "https://www.cl.cam.ac.uk/teaching/1415/part3.html",
    "https://www.cl.cam.ac.uk/teaching/1516/part1a-cst.html",
    "https://www.cl.cam.ac.uk/teaching/1516/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/1516/part2.html",
    "https://www.cl.cam.ac.uk/teaching/1516/part3.html",
    "https://www.cl.cam.ac.uk/teaching/1617/part1a-75.html",
    "https://www.cl.cam.ac.uk/teaching/1617/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/1617/part2.html",
    "https://www.cl.cam.ac.uk/teaching/1617/part3.html",
    "https://www.cl.cam.ac.uk/teaching/1718/part1a-75.html",
    "https://www.cl.cam.ac.uk/teaching/1718/part1b-75.html",
    "https://www.cl.cam.ac.uk/teaching/1718/part2.html",
    "https://www.cl.cam.ac.uk/teaching/1718/part3.html",
    "https://www.cl.cam.ac.uk/teaching/1819/part1a-75.html",
    "https://www.cl.cam.ac.uk/teaching/1819/part1b-75.html",
    "https://www.cl.cam.ac.uk/teaching/1819/part2-75.html",
    "https://www.cl.cam.ac.uk/teaching/1819/part3.html",
    "https://www.cl.cam.ac.uk/teaching/1920/part1a-75.html",
    "https://www.cl.cam.ac.uk/teaching/1920/part1b-75.html",
    "https://www.cl.cam.ac.uk/teaching/1920/part2-75.html",
    "https://www.cl.cam.ac.uk/teaching/1920/part3.html",
    "https://www.cl.cam.ac.uk/teaching/2021/part1a.html",
    "https://www.cl.cam.ac.uk/teaching/2021/part1b-75.html",
    "https://www.cl.cam.ac.uk/teaching/2021/part2-75.html",
    "https://www.cl.cam.ac.uk/teaching/2021/part3.html",
    "https://www.cl.cam.ac.uk/teaching/2122/part1a.html",
    "https://www.cl.cam.ac.uk/teaching/2122/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/2122/part2-75.html",
    "https://www.cl.cam.ac.uk/teaching/2122/part3.html",
    "https://www.cl.cam.ac.uk/teaching/2223/part1a.html",
    "https://www.cl.cam.ac.uk/teaching/2223/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/2223/part2.html",
    "https://www.cl.cam.ac.uk/teaching/2223/part3.html",
    "https://www.cl.cam.ac.uk/teaching/2324/part1a.html",
    "https://www.cl.cam.ac.uk/teaching/2324/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/2324/part2.html",
    "https://www.cl.cam.ac.uk/teaching/2324/part3.html",
    "https://www.cl.cam.ac.uk/teaching/2425/part1a.html",
    "https://www.cl.cam.ac.uk/teaching/2425/part1b.html",
    "https://www.cl.cam.ac.uk/teaching/2425/part2.html",
    "https://www.cl.cam.ac.uk/teaching/2425/part3.html",
]


def academic_year_to_second_year(year):
    tmp = int(year[2:])
    if tmp < 90:
        return f"20{year[2:]}"
    else:
        return f"19{year[2:]}"


async def main():
    db = Prisma(auto_register=True)
    await db.connect()

    cst_tripos = await db.tripos.find_first(
        where={"code": "CST"}, include={"TriposPart": True}
    )

    print(cst_tripos)

    for url in SOURCE_URLS:
        year = academic_year_to_second_year(url.split("/")[-2])

        tripos_part = url.split("/")[-1].split(".")[0].split("-")[0][4:]

        tripos_part = next(
            (part for part in cst_tripos.TriposPart if part.name == tripos_part), None
        )

        if tripos_part is None:
            print(f"Tripos part {tripos_part} not found")
            continue

        courses = json.load(open(f"./data/courses_{url.split('/')[-2]}_{tripos_part.name}.json"))
        lecturers = json.load(open(f"./data/lecturers_{url.split('/')[-2]}_{tripos_part.name}.json"))

        for crsid, name in lecturers.items():
            await db.user.upsert(
                where={"crsid": crsid},
                data={
                    "create": {
                        "crsid": crsid,
                        "ravenId": crsid + "@cam.ac.uk",
                        "name": name,
                        "admin": False,
                        "lecturer": True,
                    },
                    "update": {
                        "name": name,
                    },
                },
            )

        for course_code, course_data in courses.items():
            course = await db.course.upsert(
                where={
                    "code_triposPartId": {
                        "code": course_code,
                        "triposPartId": tripos_part.id,
                    }
                },
                data={
                    "create": {
                        "code": course_code,
                        "name": course_data["course_name"],
                        "triposPart": {"connect": {"id": tripos_part.id}},
                    },
                    "update": {
                        "name": course_data["course_name"],
                    },
                },
            )

            print(course.name, year)

            course_year = await db.courseyear.upsert(
                where={
                    "courseId_year": {
                        "courseId": course.id,
                        "year": year,
                    }
                },
                data={
                    "create": {
                        "course": {"connect": {"id": course.id}},
                        "year": year,
                        "courseYearUrl": course_data["course_url"],
                        "lectures": (
                            course_data.get("lectures", None)
                            if course_data.get("lectures", None) is not None
                            else 0
                        ),
                        "suggestedSupervisions": (
                            course_data.get("supervisions", None)
                            if course_data.get("supervisions", None) is not None
                            else 0
                        ),
                        "description": Base64.encode(
                            zlib.compress(
                                (course_data.get("description", None)
                                if course_data.get("description", None) is not None
                                else course.name).encode("utf-8")
                            )
                        ),
                        "michaelmas": course_data["michaelmas"],
                        "lent": course_data["lent"],
                        "easter": course_data["easter"],
                    },
                    "update": {
                        "description": Base64.encode(
                            zlib.compress(
                                (course_data.get("description", None)
                                if course_data.get("description", None) is not None
                                else course.name).encode("utf-8")
                            )
                        ),
                    },
                },
            )

            # link the course year to the lecturers
            for crsid in course_data["lecturers"]:
                lecturer = await db.user.find_first(where={"crsid": crsid})
                if lecturer is None:
                    print(f"Lecturer {crsid} not found")
                    continue

                await db.courseyearlecturer.upsert(
                    where={
                        "courseYearId_lecturerId": {
                            "courseYearId": course_year.id,
                            "lecturerId": lecturer.id,
                        }
                    },
                    data={
                        "create": {
                            "courseYear": {"connect": {"id": course_year.id}},
                            "lecturer": {"connect": {"id": lecturer.id}},
                        },
                        "update": {},
                    },
                )

            # TODO: prerequisites
            # TODO: questions

    await db.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
