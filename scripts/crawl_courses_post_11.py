from bs4 import BeautifulSoup
import requests
import json
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)

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
][::-1]

TERMS = {
    "michaelmas": "Michaelmas term",
    "lent": "Lent term",
    "easter": "Easter term",
}


def crawl_course(url):
    # returns prereq of URLs, aims, syllabus, objectives, recommended reading, and all exam question+solution links for that year
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")

    # the course year is found in a p tag with class "subtitle" within a div with id "sub-brand"
    try:
        rawyear = soup.find("div", id="sub-brand").find("p").text.split()[-1]
        rawyear = rawyear.split("–")
        year = rawyear[0][2:] + rawyear[1]
    except (AttributeError, IndexError):
        return {
            "supervisions": 0,
            "lectures": 0,
            "prerequisite_for": [],
            "past_exam_questions": None,
            "description": None,
        }

    content_primary = soup.find("div", id="content-primary").find_all("p")
    # Convert content_primary to a string
    content_primary_str = "\n".join([str(p) for p in content_primary])
    system_message = """
        You are a helpful assistant that extracts information from HTML.
        You are given a string of HTML content, and you need to extract the number of lectures,
        the number of supervisions, and the URL of the past exam questions. If there are multiple URLs, choose
        the first one. Return the data in the
        JSON format: {"lectures": int | null, "supervisions": int | null, "past_exam_questions": str | null}.
        JUST return the JSON, nothing else, do not say anything else.
    """
    max_retries = 5
    retries = 0
    success = False

    while retries < max_retries and not success:
        try:
            completion = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": system_message,
                    },
                    {
                        "role": "user",
                        "content": content_primary_str,
                    },
                ],
            )

            result = completion.choices[0].message.content

            if result.startswith("```json"):
                result = result[len("```json") : -len("```")]

            json_completion = json.loads(result)
            success = True  # Parsing was successful

        except json.JSONDecodeError:
            retries += 1
            if retries >= max_retries:
                raise  # Re-raise the exception if max retries reached

    lectures = json_completion["lectures"]
    supervisions = json_completion["supervisions"]
    past_exam_questions = json_completion["past_exam_questions"]

    # description is a long HTML string!
    # it's within the div with id "content-primary"
    # all the HTML after the first h1, div, and two p tags
    content_primary = soup.find("div", id="content-primary")
    if content_primary:
        # Skip the first h1, div, and two p tags
        children = list(content_primary.children)
        skip_count = 0
        description_parts = []
        for child in children:
            if child.name in ["h1", "div", "p"] and skip_count <= 4:
                skip_count += 1
                continue
            description_parts.append(
                child.decode_contents()
                if hasattr(child, "decode_contents")
                else str(child)
            )
        description = "".join(description_parts)
    else:
        description = None

    return {
        "supervisions": supervisions,
        "lectures": lectures,
        "prerequisite_for": [],
        "past_exam_questions": past_exam_questions,
        "description": description,
    }


def crawl_part_year(url):
    year = url.split("/")[-2]
    tripos_part = url.split("/")[-1].split(".")[0].split("-")[0][4:]
    courses = {}  # indexed by course code
    lecturers = {}  # indexed by crsid

    # Get the page content
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")

    for term in TERMS:
        h2 = soup.find("h2", string=TERMS[term])
        if h2 is None:
            continue
        # the next sibling is a ul of li courses i want to iterate over
        ul = h2.find_next_sibling("ul")
        for li in ul.find_all("li"):
            # <li style="margin-top: 0.5em"><b><a href="Databases/">Databases</a></b>
            #  – <a href="/~tgg22/">Dr Timothy Griffin</a>
            #  – 12&nbsp;h</li>
            course_name = li.find("b").text
            course_code = li.find("a")["href"].split("/")[0]
            course_url = "/".join(url.split("/")[:-1]) + "/" + course_code

            print(course_name, course_code, course_url)

            if course_name == "Group Project":
                course_code = "GroupProj"
                course_url = "https://www.cl.cam.ac.uk/teaching/group-projects/"

            course_lecturers = []

            # add all lecturers
            for a in li.find_all("a"):
                if a["href"].startswith("http://www.cl.cam.ac.uk/~"):
                    lecturer_name = a.text
                    lecturer_crsid = a["href"].split("/")[-2][1:]
                    lecturers[lecturer_crsid] = lecturer_name
                    course_lecturers.append(lecturer_crsid)

            course = (
                crawl_course(course_url)
                if course_code not in courses
                else courses[course_code]
            )

            course["course_name"] = course_name
            course["course_code"] = course_code
            course["course_url"] = course_url
            course["lecturers"] = (
                [*course["lecturers"], *course_lecturers]
                if "lecturers" in course
                else course_lecturers
            )
            course["year"] = year
            course["tripos_part"] = tripos_part
            for allterm in TERMS:
                course[allterm] = course[allterm] if allterm in course else False
            course[term] = True

            courses[course_code] = course

    json.dump(courses, open(f"./data/courses_{year}_{tripos_part}.json", "w"))
    json.dump(lecturers, open(f"./data/lecturers_{year}_{tripos_part}.json", "w"))


def main():
    for url in SOURCE_URLS:
        print(url)
        crawl_part_year(url)

        # temporary break
        # break


if __name__ == "__main__":
    main()
