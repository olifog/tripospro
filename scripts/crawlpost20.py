from bs4 import BeautifulSoup
import requests
import json


SOURCE_URLS = [
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
]

TERMS = {
    "michaelmas": "Michaelmas term",
    "lent": "Lent term",
    "easter": "Easter term",
}


def crawl_course(url):
    # returns prereq of URLs, aims, syllabus, objectives, recommended reading, and all exam question+solution links for that year
    response = requests.get(url)
    soup = BeautifulSoup(response.content, "html.parser")

    # the course year is found in a p tag with class "campl-sub-title" and id "sub-title"
    try:
        rawyear = soup.find("p", class_="campl-sub-title", id="sub-title").text.split()[
            -1
        ]
        rawyear = rawyear.split("–")
        year = rawyear[0][2:] + rawyear[1]
    except AttributeError:
        return {
            "supervisions": 0,
            "prerequisite_for": [],
            "past_exam_questions": None,
            "description": None,
        }

    # <b>Suggested hours of supervisions:</b>
    # the next sibling is some plain text
    supervisions_tag = soup.find("b", string="Suggested hours of supervisions:")
    if supervisions_tag is not None:
        supervisions = int(supervisions_tag.next_sibling.strip())
    else:
        supervisions = 0

    # <b>This course is a prerequisite for:</b>
    # the next n siblings until a <br> tag are <a> tags, alternating with raw text containing ","
    # get all the hrefs
    prerequisite_for = []
    a = soup.find("b", string="This course is a prerequisite for:")

    if a is not None:
        a = a.find_next_sibling()
        while a and a.name != "br":
            prerequisite_for.append(a["href"].split("/")[1])
            a = a.find_next_sibling()

    # <a href="https://www.cl.cam.ac.uk/teaching/exams/pastpapers/t-Object-OrientedProgramming.html">Past exam questions</a>
    # get the raw hrefs
    past_exam_questions = [
        a["href"]
        for a in soup.find_all("a", href=True)
        if "past exam questions" in a.text.lower()
    ]
    if len(past_exam_questions) == 0:
        past_exam_questions = None
    else:
        past_exam_questions = past_exam_questions[0]


    # description is the HTML of the div with class "ucampas-include-html"
    description_tag = soup.find("div", class_="ucampas-include-html")
    if description_tag is not None:
        description = description_tag.decode_contents()
    else:
        description = None

    return {
        "supervisions": supervisions,
        "prerequisite_for": prerequisite_for,
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
                if a["href"].startswith("/~"):
                    lecturer_name = a.text
                    lecturer_crsid = a["href"].split("/")[1][1:]
                    lecturers[lecturer_crsid] = lecturer_name
                    course_lecturers.append(lecturer_crsid)

            text_parts = li.text.split("–")

            try:
                lectures = int(text_parts[-1].split()[0])
            except ValueError:
                lectures = None

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
            course["lectures"] = (
                course["lectures"] if "lectures" in course else lectures
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
